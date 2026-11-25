"use server";

import { db as globalDb } from "@/lib/db";
import {
  assertRefs,
  EMAIL_RE,
  ensure,
  fail,
  ok,
  reader,
  withUser,
  type ActionContext,
  type ActionState,
} from "@/lib/action-utils";
import { BOARD_POSITIONS, COLORS, MEMBER_STATUSES, ROLES } from "@/lib/constants";
import { can, isAdmin } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { baseUrl } from "@/lib/request-info";
import { newToken, sha256 } from "@/lib/tokens";

/** One-time link (only its hash is stored). INVITE: 7 days, RESET: 24 hours. */
async function newInvitation(ctx: ActionContext, userId: string, kind: "INVITE" | "RESET") {
  await globalDb.invitation.updateMany({ where: { userId, usedAt: null }, data: { expiresAt: new Date() } });
  const token = newToken();
  await globalDb.invitation.create({
    data: {
      tokenHash: sha256(token),
      kind,
      userId,
      associationId: ctx.association.id,
      invitedById: ctx.user.id,
      expiresAt: new Date(Date.now() + (kind === "INVITE" ? 7 * 24 : 24) * 3600_000),
    },
  });
  return `${await baseUrl()}/invite/${token}`;
}

function readProfile(fd: FormData) {
  const f = reader(fd);
  return {
    name: f.str("name"),
    email: f.str("email").toLowerCase(),
    phone: f.opt("phone"),
    bio: f.opt("bio"),
    skills: f.opt("skills"),
    avatarColor: f.oneOf("avatarColor", COLORS, "indigo"),
  };
}

function readMembership(fd: FormData) {
  const f = reader(fd);
  return {
    title: f.opt("title"),
    role: f.oneOf("role", ROLES, "MEMBER"),
    boardPosition: f.optOneOf("boardPosition", BOARD_POSITIONS),
    joinedAt: f.date("joinedAt"),
  };
}

export async function createMember(_prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, db, association } = ctx;
    ensure(can.manageMembers(user), t);
    const f = reader(fd);
    const profile = readProfile(fd);
    const membership = readMembership(fd);
    const errors: Record<string, string> = {};
    if (!profile.name) errors.name = t.validation.required;
    if (!EMAIL_RE.test(profile.email)) errors.email = t.validation.email;
    if (Object.keys(errors).length) return fail(Object.values(errors)[0], errors);
    const poles = f.all("poles");
    for (const poleId of poles) await assertRefs(ctx, { poleId });

    let account = await globalDb.user.findUnique({ where: { email: profile.email } });
    if (account && (await db.member.count({ where: { userId: account.id } }))) {
      return fail(t.members.emailTaken, { email: t.members.emailTaken });
    }
    const existed = !!account;
    account ??= await globalDb.user.create({ data: { ...profile, locale: association.locale } });
    await db.member.create({
      data: {
        ...membership,
        joinedAt: membership.joinedAt ?? new Date(),
        associationId: association.id,
        userId: account.id,
      },
    });
    for (const poleId of poles) {
      await db.poleMember.upsert({
        where: { poleId_userId: { poleId, userId: account.id } },
        create: { poleId, userId: account.id },
        update: {},
      });
    }
    await logActivity(ctx, {
      actorId: user.id,
      action: "invited",
      entityType: "member",
      entityId: account.id,
      entityLabel: account.name,
    });

    if (existed) return ok(t.members.addedExisting, { id: account.id });
    if (f.bool("invite")) return ok(t.members.inviteCreated, { link: await newInvitation(ctx, account.id, "INVITE") });
    return ok(t.common.created, { id: account.id });
  });
}

export async function updateMember(userId: string, _prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, db, association } = ctx;
    ensure(can.editProfile(user, userId), t);
    const member = await db.member.findUnique({
      where: { associationId_userId: { associationId: association.id, userId } },
    });
    const account = await globalDb.user.findUnique({ where: { id: userId } });
    if (!member || !account) return fail(t.common.notFound);

    // Account details (name, email…) are shared by all associations: an admin may only
    // edit them for people who haven't activated their account yet.
    const canEditAccount = userId === user.id || !account.passwordHash;
    if (canEditAccount) {
      const profile = readProfile(fd);
      const errors: Record<string, string> = {};
      if (!profile.name) errors.name = t.validation.required;
      if (!EMAIL_RE.test(profile.email)) errors.email = t.validation.email;
      else if (profile.email !== account.email && (await globalDb.user.findUnique({ where: { email: profile.email } })))
        errors.email = t.members.emailTaken;
      if (Object.keys(errors).length) return fail(Object.values(errors)[0], errors);
      await globalDb.user.update({ where: { id: userId }, data: profile });
    }

    const f = reader(fd);
    if (isAdmin(user) && f.has("role")) {
      const m = readMembership(fd);
      if (userId === user.id && m.role !== "ADMIN")
        return fail(t.members.cannotDemoteSelf, { role: t.members.cannotDemoteSelf });
      await db.member.update({
        where: { id: member.id },
        data: {
          role: m.role,
          boardPosition: m.boardPosition,
          title: m.title,
          ...(m.joinedAt ? { joinedAt: m.joinedAt } : {}),
        },
      });
    } else if (f.has("title")) {
      await db.member.update({ where: { id: member.id }, data: { title: f.opt("title") } });
    }
    await logActivity(ctx, {
      actorId: user.id,
      action: "updated",
      entityType: "member",
      entityId: userId,
      entityLabel: account.name,
    });
    return ok(t.common.saved);
  });
}

export async function createInviteLink(userId: string, kind: "INVITE" | "RESET") {
  return withUser(async (ctx) => {
    const { user, t, db } = ctx;
    ensure(can.manageMembers(user), t);
    if (!(await db.member.count({ where: { userId } }))) return fail(t.common.notFound);
    const account = await globalDb.user.findUniqueOrThrow({
      where: { id: userId },
      include: { _count: { select: { memberships: true } } },
    });
    if (kind === "RESET" || account.passwordHash) {
      // Resetting someone else's password is only allowed for people who belong to this association only.
      if (account._count.memberships > 1) return fail(t.members.resetOnlySingle);
      return ok(t.members.inviteCreated, {
        link: await newInvitation(ctx, userId, account.passwordHash ? "RESET" : "INVITE"),
      });
    }
    return ok(t.members.inviteCreated, { link: await newInvitation(ctx, userId, "INVITE") });
  });
}

export async function setMemberStatus(userId: string, status: string) {
  return withUser(async ({ user, t, db, association }) => {
    ensure(can.manageMembers(user), t);
    const next = MEMBER_STATUSES.includes(status as never) ? status : "ACTIVE";
    if (userId === user.id && next !== "ACTIVE") return fail(t.members.cannotDeleteSelf);
    await db.member.update({
      where: { associationId_userId: { associationId: association.id, userId } },
      data: { status: next },
    });
    return ok(t.common.saved);
  });
}

/** Removes someone from the association (and deletes placeholder accounts nobody activated). */
export async function deleteMember(userId: string) {
  return withUser(async (ctx) => {
    const { user, t, db, association } = ctx;
    ensure(can.manageMembers(user), t);
    if (userId === user.id) return fail(t.members.cannotDeleteSelf);
    const account = await globalDb.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { memberships: true } } },
    });
    if (!account || !(await db.member.count({ where: { userId } }))) return fail(t.common.notFound);
    await db.member.delete({ where: { associationId_userId: { associationId: association.id, userId } } });
    await db.poleMember.deleteMany({ where: { userId } });
    await db.projectMember.deleteMany({ where: { userId } });
    if (!account.passwordHash && account._count.memberships <= 1) {
      await globalDb.user.delete({ where: { id: userId } });
    }
    await logActivity(ctx, { actorId: user.id, action: "deleted", entityType: "member", entityLabel: account.name });
    return ok(t.common.deleted);
  });
}
