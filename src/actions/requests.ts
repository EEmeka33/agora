"use server";

import {
  assertRefs,
  ensure,
  fail,
  ok,
  reader,
  withUser,
  type ActionContext,
  type ActionState,
} from "@/lib/action-utils";
import { PRIORITIES } from "@/lib/constants";
import { can, isManager } from "@/lib/permissions";
import { poleLeadIds } from "@/lib/queries";
import { logActivity } from "@/lib/activity";
import { notify, poleMemberIds } from "@/lib/notifications";

function readRequest(fd: FormData) {
  const f = reader(fd);
  return {
    title: f.str("title"),
    description: f.opt("description"),
    priority: f.oneOf("priority", PRIORITIES, "MEDIUM"),
    dueDate: f.date("dueDate"),
    poleId: f.str("poleId"),
    fromPoleId: f.opt("fromPoleId"),
    projectId: f.opt("projectId"),
  };
}

export async function createRequest(_prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, db, association } = ctx;
    const data = readRequest(fd);
    const errors: Record<string, string> = {};
    if (!data.title) errors.title = t.validation.required;
    if (!data.poleId) errors.poleId = t.validation.required;
    if (Object.keys(errors).length) return fail(Object.values(errors)[0], errors);
    await assertRefs(ctx, { poleId: data.poleId, projectId: data.projectId });
    if (data.fromPoleId) await assertRefs(ctx, { poleId: data.fromPoleId });
    const request = await db.request.create({ data: { ...data, associationId: association.id, requesterId: user.id } });
    const pole = await db.pole.findUnique({ where: { id: data.poleId }, select: { name: true } });
    await logActivity(ctx, {
      actorId: user.id,
      action: "created",
      entityType: "request",
      entityId: request.id,
      entityLabel: request.title,
    });
    await notify(ctx, {
      userIds: await poleMemberIds(data.poleId),
      type: "request.new",
      data: { title: request.title, pole: pole?.name ?? "" },
      link: `/requests/${request.id}`,
    });
    return ok(t.common.created, { id: request.id });
  });
}

/** Turns an open request into a task assigned to `assigneeId` (atomic: only one person can take it). */
async function giveRequest(ctx: ActionContext, id: string, assigneeId: string) {
  const { db, t, association } = ctx;
  const request = await db.request.findUnique({ where: { id } });
  if (!request) return fail(t.common.notFound);
  const taken = await db.request.updateMany({
    where: { id, status: "OPEN" },
    data: { status: "TAKEN", takenById: assigneeId, takenAt: new Date() },
  });
  if (taken.count === 0) return fail(t.requests.alreadyTaken);
  const task = await db.task.create({
    data: {
      associationId: association.id,
      title: request.title,
      description: request.description,
      priority: request.priority,
      dueDate: request.dueDate,
      poleId: request.poleId,
      projectId: request.projectId,
      assigneeId,
      creatorId: request.requesterId,
    },
  });
  await db.request.update({ where: { id }, data: { taskId: task.id } });
  return { request, task };
}

async function isPoleMember(ctx: ActionContext, poleId: string, userId: string) {
  return (await ctx.db.poleMember.count({ where: { poleId, userId } })) > 0;
}

export async function takeRequest(id: string) {
  return withUser(async (ctx) => {
    const { user, t, db } = ctx;
    const request = await db.request.findUnique({ where: { id } });
    if (!request) return fail(t.common.notFound);
    if (!isManager(user) && !(await isPoleMember(ctx, request.poleId, user.id))) return fail(t.requests.notInPole);
    const result = await giveRequest(ctx, id, user.id);
    if (!result || !("task" in result)) return result;
    await logActivity(ctx, {
      actorId: user.id,
      action: "took",
      entityType: "request",
      entityId: id,
      entityLabel: request.title,
    });
    await notify(ctx, {
      userIds: [request.requesterId],
      type: "request.taken",
      data: { title: request.title },
      link: `/requests/${id}`,
    });
    return ok(t.requests.takenToast, { taskId: result.task!.id });
  });
}

export async function assignRequest(id: string, _prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, db } = ctx;
    const request = await db.request.findUnique({ where: { id } });
    if (!request) return fail(t.common.notFound);
    ensure(can.assignRequest(user, await poleLeadIds(db, request.poleId)), t);
    const assigneeId = reader(fd).str("userId");
    if (!assigneeId || !(await isPoleMember(ctx, request.poleId, assigneeId)))
      return fail(t.requests.notInPole, { userId: t.requests.notInPole });
    const result = await giveRequest(ctx, id, assigneeId);
    if (!result || !("task" in result)) return result;
    const assignee = await db.user.findUnique({ where: { id: assigneeId }, select: { name: true } });
    await logActivity(ctx, {
      actorId: assigneeId,
      action: "took",
      entityType: "request",
      entityId: id,
      entityLabel: request.title,
    });
    await notify(ctx, {
      userIds: [assigneeId],
      type: "request.assigned",
      data: { title: request.title },
      link: `/tasks/${result.task!.id}`,
    });
    await notify(ctx, {
      userIds: [request.requesterId],
      type: "request.taken",
      data: { title: request.title, actor: assignee?.name ?? "" },
      link: `/requests/${id}`,
    });
    return ok(t.common.saved);
  });
}

/** The person who took it (or a manager) gives the request back to the pole. */
export async function releaseRequest(id: string) {
  return withUser(async (ctx) => {
    const { user, t, db } = ctx;
    const request = await db.request.findUnique({ where: { id }, include: { task: true } });
    if (!request) return fail(t.common.notFound);
    ensure(request.takenById === user.id || isManager(user), t);
    if (request.status !== "TAKEN") return fail(t.common.notAllowed);
    await db.request.update({ where: { id }, data: { status: "OPEN", takenById: null, takenAt: null, taskId: null } });
    if (request.task && request.task.status !== "DONE") await db.task.delete({ where: { id: request.task.id } });
    return ok(t.common.saved);
  });
}

export async function cancelRequest(id: string) {
  return withUser(async (ctx) => {
    const { user, t, db } = ctx;
    const request = await db.request.findUnique({ where: { id } });
    if (!request) return fail(t.common.notFound);
    ensure(can.cancelRequest(user, request), t);
    if (request.status !== "OPEN") return fail(t.requests.alreadyTaken);
    await db.request.update({ where: { id }, data: { status: "CANCELLED", closedAt: new Date() } });
    return ok(t.common.saved);
  });
}
