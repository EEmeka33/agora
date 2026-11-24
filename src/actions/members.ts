"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { EMAIL_RE, ensure, fail, ok, reader, withUser, type ActionState } from "@/lib/action-utils";
import { BOARD_POSITIONS, COLORS, MEMBER_STATUSES, ROLES } from "@/lib/constants";
import { can, isAdmin } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";

async function baseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || /^\d/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

async function newInvitation(userId: string, kind: "INVITE" | "RESET", invitedById: string) {
  // Previous unused links for this user stop working.
  await db.invitation.updateMany({ where: { userId, usedAt: null }, data: { expiresAt: new Date() } });
  const token = randomBytes(24).toString("base64url");
  await db.invitation.create({
    data: { token, kind, userId, invitedById, expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) },
  });
  return `${await baseUrl()}/invite/${token}`;
}

function readProfile(fd: FormData) {
  const f = reader(fd);
  return {
    name: f.str("name"),
    email: f.str("email").toLowerCase(),
    phone: f.opt("phone"),
    title: f.opt("title"),
    bio: f.opt("bio"),
    skills: f.opt("skills"),
    avatarColor: f.oneOf("avatarColor", COLORS, "indigo"),
  };
}

export async function createMember(_prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    ensure(can.manageMembers(user), t);
    const f = reader(fd);
    const data = readProfile(fd);
    const errors: Record<string, string> = {};
    if (!data.name) errors.name = t.validation.required;
    if (!EMAIL_RE.test(data.email)) errors.email = t.validation.email;
    else if (await db.user.findUnique({ where: { email: data.email } })) errors.email = t.members.emailTaken;
    if (Object.keys(errors).length) return fail(t.validation.required, errors);

    const member = await db.user.create({
      data: {
        ...data,
        role: f.oneOf("role", ROLES, "MEMBER"),
        boardPosition: f.optOneOf("boardPosition", BOARD_POSITIONS),
        joinedAt: f.date("joinedAt") ?? new Date(),
        poleMemberships: { create: f.all("poles").map((poleId) => ({ poleId })) },
      },
    });
    await logActivity({
      actorId: user.id,
      action: "invited",
      entityType: "member",
      entityId: member.id,
      entityLabel: member.name,
    });
    if (f.bool("invite")) {
      const link = await newInvitation(member.id, "INVITE", user.id);
      return ok(t.members.inviteCreated, { link });
    }
    return ok(t.common.created, { id: member.id });
  });
}

export async function updateMember(id: string, _prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    ensure(can.editProfile(user, id), t);
    const target = await db.user.findUnique({ where: { id } });
    if (!target) return fail(t.common.notFound);
    const f = reader(fd);
    const data = readProfile(fd);
    const errors: Record<string, string> = {};
    if (!data.name) errors.name = t.validation.required;
    if (!EMAIL_RE.test(data.email)) errors.email = t.validation.email;
    else if (data.email !== target.email && (await db.user.findUnique({ where: { email: data.email } })))
      errors.email = t.members.emailTaken;
    if (Object.keys(errors).length) return fail(t.validation.required, errors);

    const adminFields: Record<string, unknown> = {};
    if (isAdmin(user) && f.has("role")) {
      const role = f.oneOf("role", ROLES, "MEMBER");
      if (id === user.id && role !== "ADMIN")
        return fail(t.members.cannotDemoteSelf, { role: t.members.cannotDemoteSelf });
      adminFields.role = role;
      adminFields.boardPosition = f.optOneOf("boardPosition", BOARD_POSITIONS);
      const joinedAt = f.date("joinedAt");
      if (joinedAt) adminFields.joinedAt = joinedAt;
    }
    await db.user.update({ where: { id }, data: { ...data, ...adminFields } });
    await logActivity({
      actorId: user.id,
      action: "updated",
      entityType: "member",
      entityId: id,
      entityLabel: data.name,
    });
    return ok(t.common.saved);
  });
}

export async function createInviteLink(userId: string, kind: "INVITE" | "RESET") {
  return withUser(async ({ user, t }) => {
    ensure(can.manageMembers(user), t);
    const target = await db.user.findUnique({ where: { id: userId } });
    if (!target) return fail(t.common.notFound);
    const link = await newInvitation(userId, kind === "RESET" ? "RESET" : "INVITE", user.id);
    return ok(t.members.inviteCreated, { link });
  });
}

export async function setMemberStatus(id: string, status: string) {
  return withUser(async ({ user, t }) => {
    ensure(can.manageMembers(user), t);
    const next = MEMBER_STATUSES.includes(status as never) ? status : "ACTIVE";
    if (id === user.id && next !== "ACTIVE") return fail(t.members.cannotDeleteSelf);
    await db.user.update({ where: { id }, data: { status: next } });
    return ok(t.common.saved);
  });
}

export async function deleteMember(id: string) {
  return withUser(async ({ user, t }) => {
    ensure(can.manageMembers(user), t);
    if (id === user.id) return fail(t.members.cannotDeleteSelf);
    const target = await db.user.delete({ where: { id } });
    await logActivity({ actorId: user.id, action: "deleted", entityType: "member", entityLabel: target.name });
    return ok(t.common.deleted);
  });
}
