"use server";

import { assertRefs, ensure, fail, ok, reader, withUser, type ActionState } from "@/lib/action-utils";
import { STEP_CATEGORIES, STEP_STATUSES } from "@/lib/constants";
import { can } from "@/lib/permissions";
import { foundationSteps } from "@/lib/foundation-template";
import { logActivity } from "@/lib/activity";

function readStep(fd: FormData) {
  const f = reader(fd);
  return {
    title: f.str("title"),
    description: f.opt("description"),
    category: f.oneOf("category", STEP_CATEGORIES, "PROJECT"),
    status: f.oneOf("status", STEP_STATUSES, "TODO"),
    assigneeId: f.opt("assigneeId"),
    dueDate: f.date("dueDate"),
    resourceUrl: f.opt("resourceUrl"),
    notes: f.opt("notes"),
  };
}

export async function createStep(_prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, db, association } = ctx;
    ensure(can.manageFoundation(user), t);
    const data = readStep(fd);
    if (!data.title) return fail(t.validation.required, { title: t.validation.required });
    await assertRefs(ctx, { userIds: [data.assigneeId] });
    const count = await db.foundationStep.count();
    const step = await db.foundationStep.create({
      data: {
        ...data,
        associationId: association.id,
        order: count,
        completedAt: data.status === "DONE" ? new Date() : null,
      },
    });
    await logActivity(ctx, {
      actorId: user.id,
      action: "created",
      entityType: "step",
      entityId: step.id,
      entityLabel: step.title,
    });
    return ok(t.common.created);
  });
}

export async function updateStep(id: string, _prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, db } = ctx;
    const step = await db.foundationStep.findUnique({ where: { id } });
    if (!step) return fail(t.common.notFound);
    ensure(can.manageFoundation(user) || step.assigneeId === user.id, t);
    const data = readStep(fd);
    if (!data.title) return fail(t.validation.required, { title: t.validation.required });
    await assertRefs(ctx, { userIds: [data.assigneeId] });
    await db.foundationStep.update({
      where: { id },
      data: { ...data, completedAt: data.status === "DONE" ? (step.completedAt ?? new Date()) : null },
    });
    await logActivity(ctx, {
      actorId: user.id,
      action: data.status === "DONE" && step.status !== "DONE" ? "completed" : "updated",
      entityType: "step",
      entityId: id,
      entityLabel: data.title,
    });
    return ok(t.common.saved);
  });
}

export async function setStepStatus(id: string, status: string) {
  return withUser(async (ctx) => {
    const { user, t, db } = ctx;
    const step = await db.foundationStep.findUnique({ where: { id } });
    if (!step) return fail(t.common.notFound);
    ensure(can.manageFoundation(user) || step.assigneeId === user.id, t);
    const next = STEP_STATUSES.includes(status as never) ? status : "TODO";
    await db.foundationStep.update({
      where: { id },
      data: { status: next, completedAt: next === "DONE" ? new Date() : null },
    });
    if (next === "DONE") {
      await logActivity(ctx, {
        actorId: user.id,
        action: "completed",
        entityType: "step",
        entityId: id,
        entityLabel: step.title,
      });
    }
    return ok();
  });
}

export async function deleteStep(id: string) {
  return withUser(async ({ user, t, db }) => {
    ensure(can.manageFoundation(user), t);
    await db.foundationStep.delete({ where: { id } });
    return ok(t.common.deleted);
  });
}

export async function loadFoundationTemplate() {
  return withUser(async ({ user, t, locale, db, association }) => {
    ensure(can.manageFoundation(user), t);
    const offset = await db.foundationStep.count();
    await db.foundationStep.createMany({
      data: foundationSteps(locale).map((s) => ({ ...s, order: s.order + offset, associationId: association.id })),
    });
    return ok(t.common.created);
  });
}
