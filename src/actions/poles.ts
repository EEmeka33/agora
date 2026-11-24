"use server";

import { db } from "@/lib/db";
import { ensure, fail, ok, reader, withUser, type ActionState } from "@/lib/action-utils";
import { COLORS, FREQUENCIES, POLE_ICONS, POLE_ROLES } from "@/lib/constants";
import { can } from "@/lib/permissions";
import { poleLeadIds } from "@/lib/queries";
import { logActivity } from "@/lib/activity";
import type { CurrentUser } from "@/lib/auth";
import type { Dictionary } from "@/lib/i18n/dictionaries";

function readPole(fd: FormData) {
  const f = reader(fd);
  return {
    name: f.str("name"),
    description: f.opt("description"),
    mission: f.opt("mission"),
    color: f.oneOf("color", COLORS, "indigo"),
    icon: f.oneOf("icon", POLE_ICONS, "layers"),
  };
}

export async function createPole(_prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    ensure(can.managePoles(user), t);
    const data = readPole(fd);
    if (!data.name) return fail(t.validation.required, { name: t.validation.required });
    const leadId = reader(fd).opt("leadId");
    const count = await db.pole.count();
    const pole = await db.pole.create({
      data: { ...data, order: count, members: leadId ? { create: { userId: leadId, role: "LEAD" } } : undefined },
    });
    await logActivity({
      actorId: user.id,
      action: "created",
      entityType: "pole",
      entityId: pole.id,
      entityLabel: pole.name,
    });
    return ok(t.common.created, { id: pole.id });
  });
}

/** Managers or leads of the pole. */
async function ensurePoleEditor(poleId: string, user: CurrentUser, t: Dictionary) {
  const leads = await poleLeadIds(poleId);
  ensure(can.managePoles(user) || leads.includes(user.id), t);
}

export async function updatePole(id: string, _prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    await ensurePoleEditor(id, user, t);
    const data = readPole(fd);
    if (!data.name) return fail(t.validation.required, { name: t.validation.required });
    await db.pole.update({ where: { id }, data });
    await logActivity({
      actorId: user.id,
      action: "updated",
      entityType: "pole",
      entityId: id,
      entityLabel: data.name,
    });
    return ok(t.common.saved);
  });
}

export async function deletePole(id: string) {
  return withUser(async ({ user, t }) => {
    ensure(can.managePoles(user), t);
    const pole = await db.pole.delete({ where: { id } });
    await logActivity({ actorId: user.id, action: "deleted", entityType: "pole", entityLabel: pole.name });
    return ok(t.common.deleted);
  });
}

export async function addPoleMember(poleId: string, _prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    await ensurePoleEditor(poleId, user, t);
    const f = reader(fd);
    const userId = f.str("userId");
    if (!userId) return fail(t.validation.required, { userId: t.validation.required });
    const role = f.oneOf("role", POLE_ROLES, "MEMBER");
    await db.poleMember.upsert({
      where: { poleId_userId: { poleId, userId } },
      create: { poleId, userId, role },
      update: { role },
    });
    const [pole, member] = await Promise.all([
      db.pole.findUnique({ where: { id: poleId }, select: { name: true } }),
      db.user.findUnique({ where: { id: userId }, select: { name: true } }),
    ]);
    await logActivity({
      actorId: userId,
      action: "joined",
      entityType: "pole",
      entityId: poleId,
      entityLabel: pole?.name,
    });
    return ok(member ? `${member.name} → ${pole?.name}` : t.common.saved);
  });
}

export async function setPoleMemberRole(poleId: string, userId: string, role: string) {
  return withUser(async ({ user, t }) => {
    await ensurePoleEditor(poleId, user, t);
    await db.poleMember.update({
      where: { poleId_userId: { poleId, userId } },
      data: { role: POLE_ROLES.includes(role as never) ? role : "MEMBER" },
    });
    return ok(t.common.saved);
  });
}

export async function removePoleMember(poleId: string, userId: string) {
  return withUser(async ({ user, t }) => {
    await ensurePoleEditor(poleId, user, t);
    await db.poleMember.delete({ where: { poleId_userId: { poleId, userId } } });
    return ok(t.common.saved);
  });
}

// ─── Responsibilities ("who does what") ─────────────────────────────────────

function readResponsibility(fd: FormData) {
  const f = reader(fd);
  return {
    title: f.str("title"),
    description: f.opt("description"),
    frequency: f.oneOf("frequency", FREQUENCIES, "ONGOING"),
    ownerId: f.opt("ownerId"),
    poleId: f.opt("poleId"),
  };
}

export async function createResponsibility(_prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    ensure(can.manageStructure(user), t);
    const data = readResponsibility(fd);
    if (!data.title) return fail(t.validation.required, { title: t.validation.required });
    const r = await db.responsibility.create({ data });
    await logActivity({
      actorId: user.id,
      action: "created",
      entityType: "responsibility",
      entityId: r.id,
      entityLabel: r.title,
    });
    return ok(t.common.created);
  });
}

export async function updateResponsibility(id: string, _prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    ensure(can.manageStructure(user), t);
    const data = readResponsibility(fd);
    if (!data.title) return fail(t.validation.required, { title: t.validation.required });
    await db.responsibility.update({ where: { id }, data });
    return ok(t.common.saved);
  });
}

export async function deleteResponsibility(id: string) {
  return withUser(async ({ user, t }) => {
    ensure(can.manageStructure(user), t);
    await db.responsibility.delete({ where: { id } });
    return ok(t.common.deleted);
  });
}
