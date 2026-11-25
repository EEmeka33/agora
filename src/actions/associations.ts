"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ensure, fail, ok, reader, withAccount, withUser, assertRefs, type ActionState } from "@/lib/action-utils";
import { BOARD_POSITIONS, CURRENCIES, LOCALES, ROLES, newAssociationsAllowed } from "@/lib/constants";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { foundationSteps } from "@/lib/foundation-template";
import { redeemJoinCode } from "@/lib/join-codes";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, baseUrl } from "@/lib/request-info";
import { newJoinCode, normalizeJoinCode } from "@/lib/tokens";
import { can, isAdmin } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { ASSOCIATION_COOKIE } from "@/lib/session-cookie";

const YEAR = 60 * 60 * 24 * 365;

const SUGGESTED_POLES = {
  communication: { color: "rose", icon: "megaphone" },
  events: { color: "amber", icon: "calendar" },
  partnerships: { color: "teal", icon: "handshake" },
  treasury: { color: "emerald", icon: "wallet" },
  members: { color: "violet", icon: "users" },
  projects: { color: "sky", icon: "leaf" },
} as const;

/** Creates a new association; the signed-in person becomes its administrator. */
export async function createAssociation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return withAccount(async ({ account, t: currentT }) => {
    if (!newAssociationsAllowed() && (await db.association.count()) > 0) return fail(currentT.welcome.creationDisabled);
    if (!rateLimit(`create-asso:${account.id}`, 5, 60 * 60_000)) return fail(currentT.account.tooMany);

    const f = reader(formData);
    const locale = f.oneOf("locale", LOCALES, "en");
    const t = dictionaries[locale];
    const name = f.str("name");
    if (!name) return fail(t.validation.required, { name: t.validation.required });
    const poleKeys = f.all("poles").filter((k): k is keyof typeof SUGGESTED_POLES => k in SUGGESTED_POLES);

    const association = await db.$transaction(async (tx) => {
      const asso = await tx.association.create({
        data: {
          name,
          shortName: f.opt("shortName"),
          purpose: f.opt("purpose"),
          legalForm: f.str("legalForm") || "Loi 1901",
          city: f.opt("city"),
          country: f.opt("country"),
          currency: f.oneOf("currency", CURRENCIES, "EUR"),
          locale,
        },
      });
      await tx.member.create({
        data: {
          associationId: asso.id,
          userId: account.id,
          role: "ADMIN",
          boardPosition: f.optOneOf("boardPosition", BOARD_POSITIONS),
        },
      });
      if (f.bool("checklist")) {
        await tx.foundationStep.createMany({
          data: foundationSteps(locale).map((s) => ({ ...s, associationId: asso.id })),
        });
      }
      for (const [i, key] of poleKeys.entries()) {
        await tx.pole.create({
          data: {
            associationId: asso.id,
            name: t.setup.suggestedPoles[key],
            color: SUGGESTED_POLES[key].color,
            icon: SUGGESTED_POLES[key].icon,
            order: i,
            members: { create: { userId: account.id, role: "LEAD" } },
          },
        });
      }
      await tx.activity.create({
        data: {
          associationId: asso.id,
          actorId: account.id,
          action: "created",
          entityType: "workspace",
          entityLabel: name,
        },
      });
      return asso;
    });

    (await cookies()).set(ASSOCIATION_COOKIE, association.id, { path: "/", maxAge: YEAR, sameSite: "lax" });
    redirect("/foundation");
  });
}

/** Joins an association with a code (signed-in account). */
export async function joinWithCode(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return withAccount(async ({ account, t }) => {
    const ip = await clientIp();
    if (!rateLimit(`join:${account.id}`, 10, 10 * 60_000) || !rateLimit(`join-ip:${ip}`, 30, 10 * 60_000)) {
      return fail(t.account.tooMany);
    }
    const code = normalizeJoinCode(reader(formData).str("code"));
    if (!code) return fail(t.join.invalid, { code: t.join.invalid });
    const result = await redeemJoinCode(account.id, code);
    if (!result.ok) {
      if (result.reason === "already" && result.associationId) {
        (await cookies()).set(ASSOCIATION_COOKIE, result.associationId, { path: "/", maxAge: YEAR, sameSite: "lax" });
        redirect("/");
      }
      const message = result.reason === "inactive" ? t.join.inactive : t.join.invalid;
      return fail(message, { code: message });
    }
    (await cookies()).set(ASSOCIATION_COOKIE, result.associationId, { path: "/", maxAge: YEAR, sameSite: "lax" });
    redirect("/");
  });
}

// ─── Join codes (inside an association) ─────────────────────────────────────

export async function createJoinCode(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return withUser(async (ctx) => {
    const { user, t, db: tdb, association } = ctx;
    ensure(can.manageCodes(user), t);
    const f = reader(formData);
    const role = f.oneOf("role", ROLES, "MEMBER");
    if (role !== "MEMBER" && !isAdmin(user))
      return fail(t.codes.managerOnlyMembers, { role: t.codes.managerOnlyMembers });
    const maxUses = Math.min(500, Math.max(1, f.int("maxUses", 10)));
    const days = f.str("expires");
    const expiresAt = ["7", "30", "90"].includes(days) ? new Date(Date.now() + Number(days) * 86_400_000) : null;
    const poleId = f.opt("poleId");
    await assertRefs(ctx, { poleId });

    let code = newJoinCode();
    for (let i = 0; i < 5 && (await db.joinCode.count({ where: { code } })); i++) code = newJoinCode();
    await tdb.joinCode.create({
      data: {
        associationId: association.id,
        code,
        label: f.opt("label"),
        role,
        maxUses,
        expiresAt,
        poleId,
        createdById: user.id,
      },
    });
    await logActivity(ctx, { actorId: user.id, action: "created", entityType: "member", entityLabel: code });
    return ok(t.common.created, { code, link: `${await baseUrl()}/join?code=${code}` });
  });
}

export async function revokeJoinCode(id: string) {
  return withUser(async ({ user, t, db: tdb }) => {
    ensure(can.manageCodes(user), t);
    await tdb.joinCode.update({ where: { id }, data: { revokedAt: new Date() } });
    return ok(t.common.saved);
  });
}
