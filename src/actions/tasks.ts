"use server";

import { db } from "@/lib/db";
import { ensure, fail, ok, reader, withUser } from "@/lib/action-utils";
import { PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import type { ActionState } from "@/lib/action-utils";

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

async function taskContext(id: string) {
  const task = await db.task.findUnique({ where: { id }, include: { project: { select: { leadId: true } } } });
  return task ? { task, projectLeadId: task.project?.leadId ?? null } : null;
}

export async function createTask(_prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    const data = readTask(fd);
    if (!data.title) return fail(t.validation.required, { title: t.validation.required });
    if (data.projectId && !data.poleId) {
      const project = await db.project.findUnique({ where: { id: data.projectId }, select: { poleId: true } });
      data.poleId = project?.poleId ?? null;
    }
    const task = await db.task.create({
      data: { ...data, creatorId: user.id, completedAt: data.status === "DONE" ? new Date() : null },
    });
    await logActivity({
      actorId: user.id,
      action: "created",
      entityType: "task",
      entityId: task.id,
      entityLabel: task.title,
    });
    return ok(t.common.created, { id: task.id });
  });
}

export async function updateTask(id: string, _prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    const ctx = await taskContext(id);
    if (!ctx) return fail(t.common.notFound);
    ensure(can.editTask(user, { ...ctx.task, projectLeadId: ctx.projectLeadId }), t);
    const data = readTask(fd);
    if (!data.title) return fail(t.validation.required, { title: t.validation.required });
    const becameDone = data.status === "DONE" && ctx.task.status !== "DONE";
    await db.task.update({
      where: { id },
      data: {
        ...data,
        completedAt: data.status === "DONE" ? (ctx.task.completedAt ?? new Date()) : null,
      },
    });
    await logActivity({
      actorId: user.id,
      action: becameDone ? "completed" : "updated",
      entityType: "task",
      entityId: id,
      entityLabel: data.title,
    });
    return ok(t.common.saved);
  });
}

export async function setTaskStatus(id: string, status: string) {
  return withUser(async ({ user, t }) => {
    const ctx = await taskContext(id);
    if (!ctx) return fail(t.common.notFound);
    ensure(can.editTask(user, { ...ctx.task, projectLeadId: ctx.projectLeadId }), t);
    const next = TASK_STATUSES.includes(status as never) ? status : "TODO";
    if (next === ctx.task.status) return ok();
    await db.task.update({
      where: { id },
      data: { status: next, completedAt: next === "DONE" ? new Date() : null },
    });
    if (next === "DONE" || ctx.task.status === "DONE") {
      await logActivity({
        actorId: user.id,
        action: next === "DONE" ? "completed" : "reopened",
        entityType: "task",
        entityId: id,
        entityLabel: ctx.task.title,
      });
    }
    return ok();
  });
}

export async function deleteTask(id: string) {
  return withUser(async ({ user, t }) => {
    const ctx = await taskContext(id);
    if (!ctx) return fail(t.common.notFound);
    ensure(can.deleteTask(user, { creatorId: ctx.task.creatorId, projectLeadId: ctx.projectLeadId }), t);
    await db.task.delete({ where: { id } });
    await logActivity({ actorId: user.id, action: "deleted", entityType: "task", entityLabel: ctx.task.title });
    return ok(t.common.deleted);
  });
}

export async function addComment(taskId: string, _prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    const body = reader(fd).str("body");
    if (!body) return fail(t.validation.required, { body: t.validation.required });
    const task = await db.task.findUnique({ where: { id: taskId }, select: { title: true } });
    if (!task) return fail(t.common.notFound);
    await db.taskComment.create({ data: { body, taskId, authorId: user.id } });
    await logActivity({
      actorId: user.id,
      action: "commented",
      entityType: "task",
      entityId: taskId,
      entityLabel: task.title,
    });
    return ok();
  });
}

export async function deleteComment(id: string) {
  return withUser(async ({ user, t }) => {
    const comment = await db.taskComment.findUnique({ where: { id } });
    if (!comment) return fail(t.common.notFound);
    ensure(comment.authorId === user.id || user.role === "ADMIN", t);
    await db.taskComment.delete({ where: { id } });
    return ok(t.common.deleted);
  });
}
