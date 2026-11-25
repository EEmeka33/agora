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
import { COLORS, HEALTH, PRIORITIES, PROJECT_STATUSES } from "@/lib/constants";
import { can } from "@/lib/permissions";
import { poleLeadIds } from "@/lib/queries";
import { logActivity } from "@/lib/activity";
import { clamp } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";

function readProject(fd: FormData) {
  const f = reader(fd);
  return {
    title: f.str("title"),
    description: f.opt("description"),
    objectives: f.opt("objectives"),
    status: f.oneOf("status", PROJECT_STATUSES, "PLANNED"),
    priority: f.oneOf("priority", PRIORITIES, "MEDIUM"),
    progressMode: f.oneOf("progressMode", ["AUTO", "MANUAL"] as const, "AUTO"),
    manualProgress: clamp(f.int("manualProgress", 0), 0, 100),
    startDate: f.date("startDate"),
    dueDate: f.date("dueDate"),
    budgetCents: f.money("budget"),
    color: f.oneOf("color", COLORS, "indigo"),
    poleId: f.opt("poleId"),
    leadId: f.opt("leadId"),
  };
}

function validate(data: ReturnType<typeof readProject>, t: Dictionary) {
  const errors: Record<string, string> = {};
  if (!data.title) errors.title = t.validation.required;
  if (data.startDate && data.dueDate && data.dueDate < data.startDate) errors.dueDate = t.validation.dateOrder;
  return Object.keys(errors).length ? fail(t.validation.required, errors) : null;
}

/** Loads a project of the current association and checks that the user may edit it. */
async function editableProject(ctx: ActionContext, id: string) {
  const project = await ctx.db.project.findUnique({ where: { id } });
  if (!project) return null;
  ensure(
    can.editProject(ctx.user, { leadId: project.leadId, poleLeadIds: await poleLeadIds(ctx.db, project.poleId) }),
    ctx.t,
  );
  return project;
}

export async function createProject(_prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, db, association } = ctx;
    const data = readProject(fd);
    await assertRefs(ctx, { poleId: data.poleId, userIds: [data.leadId] });
    // Pole leads may create projects in their pole.
    const leads = await poleLeadIds(db, data.poleId);
    ensure(can.createProject(user) || leads.includes(user.id), t);
    const invalid = validate(data, t);
    if (invalid) return invalid;
    const project = await db.project.create({
      data: {
        ...data,
        associationId: association.id,
        members: data.leadId ? { create: { userId: data.leadId } } : undefined,
      },
    });
    await logActivity(ctx, {
      actorId: user.id,
      action: "created",
      entityType: "project",
      entityId: project.id,
      entityLabel: project.title,
    });
    return ok(t.common.created, { id: project.id });
  });
}

export async function updateProject(id: string, _prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, db } = ctx;
    const project = await editableProject(ctx, id);
    if (!project) return fail(t.common.notFound);
    const data = readProject(fd);
    const invalid = validate(data, t);
    if (invalid) return invalid;
    await assertRefs(ctx, { poleId: data.poleId, userIds: [data.leadId] });
    await db.project.update({ where: { id }, data });
    if (data.leadId) {
      await db.projectMember.upsert({
        where: { projectId_userId: { projectId: id, userId: data.leadId } },
        create: { projectId: id, userId: data.leadId },
        update: {},
      });
    }
    const completed = data.status === "COMPLETED" && project.status !== "COMPLETED";
    await logActivity(ctx, {
      actorId: user.id,
      action: completed ? "completed" : "updated",
      entityType: "project",
      entityId: id,
      entityLabel: data.title,
    });
    return ok(t.common.saved);
  });
}

export async function deleteProject(id: string) {
  return withUser(async (ctx) => {
    const { user, t, db } = ctx;
    const project = await editableProject(ctx, id);
    if (!project) return fail(t.common.notFound);
    await db.project.delete({ where: { id } });
    await logActivity(ctx, { actorId: user.id, action: "deleted", entityType: "project", entityLabel: project.title });
    return ok(t.common.deleted);
  });
}

// ─── Milestones ─────────────────────────────────────────────────────────────

export async function addMilestone(projectId: string, _prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { t, db } = ctx;
    const project = await editableProject(ctx, projectId);
    if (!project) return fail(t.common.notFound);
    const f = reader(fd);
    const title = f.str("title");
    if (!title) return fail(t.validation.required, { title: t.validation.required });
    const count = await db.milestone.count({ where: { projectId } });
    await db.milestone.create({ data: { projectId, title, dueDate: f.date("dueDate"), order: count } });
    return ok(t.common.created);
  });
}

export async function toggleMilestone(id: string) {
  return withUser(async (ctx) => {
    const { user, t, db } = ctx;
    const milestone = await db.milestone.findUnique({ where: { id } });
    if (!milestone) return fail(t.common.notFound);
    await editableProject(ctx, milestone.projectId);
    await db.milestone.update({
      where: { id },
      data: { done: !milestone.done, doneAt: milestone.done ? null : new Date() },
    });
    if (!milestone.done) {
      await logActivity(ctx, {
        actorId: user.id,
        action: "completed",
        entityType: "milestone",
        entityId: milestone.projectId,
        entityLabel: milestone.title,
      });
    }
    return ok();
  });
}

export async function deleteMilestone(id: string) {
  return withUser(async (ctx) => {
    const { t, db } = ctx;
    const milestone = await db.milestone.findUnique({ where: { id } });
    if (!milestone) return fail(t.common.notFound);
    await editableProject(ctx, milestone.projectId);
    await db.milestone.delete({ where: { id } });
    return ok(t.common.deleted);
  });
}

// ─── Updates ────────────────────────────────────────────────────────────────

export async function postProjectUpdate(projectId: string, _prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, db } = ctx;
    const project = await db.project.findUnique({ where: { id: projectId }, include: { members: true } });
    if (!project) return fail(t.common.notFound);
    const isTeam = project.members.some((m) => m.userId === user.id);
    ensure(
      isTeam || can.editProject(user, { leadId: project.leadId, poleLeadIds: await poleLeadIds(db, project.poleId) }),
      t,
    );
    const f = reader(fd);
    const body = f.str("body");
    if (!body) return fail(t.validation.required, { body: t.validation.required });
    const progressRaw = f.str("progress");
    await db.projectUpdate.create({
      data: {
        projectId,
        authorId: user.id,
        body,
        health: f.oneOf("health", HEALTH, "ON_TRACK"),
        progress: progressRaw ? clamp(Number.parseInt(progressRaw, 10) || 0, 0, 100) : null,
      },
    });
    await logActivity(ctx, {
      actorId: user.id,
      action: "posted",
      entityType: "update",
      entityId: projectId,
      entityLabel: project.title,
    });
    return ok(t.common.created);
  });
}

// ─── Team ───────────────────────────────────────────────────────────────────

export async function addProjectMember(projectId: string, _prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { t, db } = ctx;
    const project = await editableProject(ctx, projectId);
    if (!project) return fail(t.common.notFound);
    const f = reader(fd);
    const userId = f.str("userId");
    if (!userId) return fail(t.validation.required, { userId: t.validation.required });
    await assertRefs(ctx, { userIds: [userId] });
    await db.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      create: { projectId, userId, role: f.opt("role") },
      update: { role: f.opt("role") },
    });
    return ok(t.common.saved);
  });
}

export async function removeProjectMember(projectId: string, userId: string) {
  return withUser(async (ctx) => {
    const { t, db } = ctx;
    const project = await editableProject(ctx, projectId);
    if (!project) return fail(t.common.notFound);
    await db.projectMember.delete({ where: { projectId_userId: { projectId, userId } } });
    return ok(t.common.saved);
  });
}
