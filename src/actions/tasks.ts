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
import { PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { notify } from "@/lib/notifications";

function readTask(fd: FormData) {
  const f = reader(fd);
  return {
    title: f.str("title"),
    description: f.opt("description"),
    status: f.oneOf("status", TASK_STATUSES, "TODO"),
    priority: f.oneOf("priority", PRIORITIES, "MEDIUM"),
    dueDate: f.date("dueDate"),
    projectId: f.opt("projectId"),
    poleId: f.opt("poleId"),
    assigneeId: f.opt("assigneeId"),
  };
}

async function taskContext(ctx: ActionContext, id: string) {
  const task = await ctx.db.task.findUnique({
    where: { id },
    include: { project: { select: { leadId: true } }, request: true },
  });
  return task ? { task, projectLeadId: task.project?.leadId ?? null } : null;
}

/** Keeps a request in sync with the task created from it. */
async function syncRequest(ctx: ActionContext, taskId: string, status: string) {
  const request = await ctx.db.request.findFirst({ where: { taskId } });
  if (!request) return;
  if (status === "DONE" && request.status !== "DONE") {
    await ctx.db.request.update({ where: { id: request.id }, data: { status: "DONE", closedAt: new Date() } });
    await notify(ctx, {
      userIds: [request.requesterId],
      type: "request.done",
      data: { title: request.title },
      link: `/requests/${request.id}`,
    });
  } else if (status !== "DONE" && request.status === "DONE") {
    await ctx.db.request.update({ where: { id: request.id }, data: { status: "TAKEN", closedAt: null } });
  }
}

export async function createTask(_prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, db, association } = ctx;
    const data = readTask(fd);
    if (!data.title) return fail(t.validation.required, { title: t.validation.required });
    await assertRefs(ctx, { projectId: data.projectId, poleId: data.poleId, userIds: [data.assigneeId] });
    if (data.projectId && !data.poleId) {
      const project = await db.project.findUnique({ where: { id: data.projectId }, select: { poleId: true } });
      data.poleId = project?.poleId ?? null;
    }
    const task = await db.task.create({
      data: {
        ...data,
        associationId: association.id,
        creatorId: user.id,
        completedAt: data.status === "DONE" ? new Date() : null,
      },
    });
    await logActivity(ctx, {
      actorId: user.id,
      action: "created",
      entityType: "task",
      entityId: task.id,
      entityLabel: task.title,
    });
    await notify(ctx, {
      userIds: [data.assigneeId],
      type: "task.assigned",
      data: { title: task.title },
      link: `/tasks/${task.id}`,
    });
    return ok(t.common.created, { id: task.id });
  });
}

export async function updateTask(id: string, _prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, db } = ctx;
    const current = await taskContext(ctx, id);
    if (!current) return fail(t.common.notFound);
    ensure(can.editTask(user, { ...current.task, projectLeadId: current.projectLeadId }), t);
    const data = readTask(fd);
    if (!data.title) return fail(t.validation.required, { title: t.validation.required });
    await assertRefs(ctx, { projectId: data.projectId, poleId: data.poleId, userIds: [data.assigneeId] });
    const becameDone = data.status === "DONE" && current.task.status !== "DONE";
    await db.task.update({
      where: { id },
      data: { ...data, completedAt: data.status === "DONE" ? (current.task.completedAt ?? new Date()) : null },
    });
    await logActivity(ctx, {
      actorId: user.id,
      action: becameDone ? "completed" : "updated",
      entityType: "task",
      entityId: id,
      entityLabel: data.title,
    });
    if (data.assigneeId && data.assigneeId !== current.task.assigneeId) {
      await notify(ctx, {
        userIds: [data.assigneeId],
        type: "task.assigned",
        data: { title: data.title },
        link: `/tasks/${id}`,
      });
    }
    if (data.status !== current.task.status) await syncRequest(ctx, id, data.status);
    return ok(t.common.saved);
  });
}

export async function setTaskStatus(id: string, status: string) {
  return withUser(async (ctx) => {
    const { user, t, db } = ctx;
    const current = await taskContext(ctx, id);
    if (!current) return fail(t.common.notFound);
    ensure(can.editTask(user, { ...current.task, projectLeadId: current.projectLeadId }), t);
    const next = TASK_STATUSES.includes(status as never) ? status : "TODO";
    if (next === current.task.status) return ok();
    await db.task.update({ where: { id }, data: { status: next, completedAt: next === "DONE" ? new Date() : null } });
    if (next === "DONE" || current.task.status === "DONE") {
      await logActivity(ctx, {
        actorId: user.id,
        action: next === "DONE" ? "completed" : "reopened",
        entityType: "task",
        entityId: id,
        entityLabel: current.task.title,
      });
    }
    await syncRequest(ctx, id, next);
    return ok();
  });
}

export async function deleteTask(id: string) {
  return withUser(async (ctx) => {
    const { user, t, db } = ctx;
    const current = await taskContext(ctx, id);
    if (!current) return fail(t.common.notFound);
    ensure(can.deleteTask(user, { creatorId: current.task.creatorId, projectLeadId: current.projectLeadId }), t);
    // A request whose task is deleted goes back to the pole.
    if (current.task.request && current.task.request.status === "TAKEN") {
      await db.request.update({
        where: { id: current.task.request.id },
        data: { status: "OPEN", takenById: null, takenAt: null },
      });
    }
    await db.task.delete({ where: { id } });
    await logActivity(ctx, {
      actorId: user.id,
      action: "deleted",
      entityType: "task",
      entityLabel: current.task.title,
    });
    return ok(t.common.deleted);
  });
}

export async function addComment(taskId: string, _prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, db } = ctx;
    const body = reader(fd).str("body");
    if (!body) return fail(t.validation.required, { body: t.validation.required });
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: { title: true, assigneeId: true, creatorId: true },
    });
    if (!task) return fail(t.common.notFound);
    const previous = await db.taskComment.findMany({
      where: { taskId },
      select: { authorId: true },
      distinct: ["authorId"],
    });
    await db.taskComment.create({ data: { body, taskId, authorId: user.id } });
    await logActivity(ctx, {
      actorId: user.id,
      action: "commented",
      entityType: "task",
      entityId: taskId,
      entityLabel: task.title,
    });
    // The assignee, the creator and everyone already in the conversation.
    await notify(ctx, {
      userIds: [task.assigneeId, task.creatorId, ...previous.map((c) => c.authorId)],
      type: "task.comment",
      data: { title: task.title },
      link: `/tasks/${taskId}`,
    });
    return ok();
  });
}

export async function deleteComment(id: string) {
  return withUser(async ({ user, t, db }) => {
    const comment = await db.taskComment.findUnique({ where: { id } });
    if (!comment) return fail(t.common.notFound);
    ensure(comment.authorId === user.id || user.role === "ADMIN", t);
    await db.taskComment.delete({ where: { id } });
    return ok(t.common.deleted);
  });
}
