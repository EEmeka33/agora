"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSession, destroySession, getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { getI18n, LOCALE_COOKIE } from "@/lib/i18n/server";
import { isLocale } from "@/lib/i18n/dictionaries";
import { fail, ok, reader, type ActionState } from "@/lib/action-utils";
import { logActivity } from "@/lib/activity";

// Very small in-memory brute-force protection (per email).
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 8;
const LOCK_MS = 5 * 60_000;

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const f = reader(formData);
  const email = f.str("email").toLowerCase();
  const password = f.str("password");
  const next = f.str("next");

  const entry = attempts.get(email);
  if (entry && entry.count >= MAX_ATTEMPTS && entry.until > Date.now()) {
    return fail(t.auth.invalidCredentials);
  }

  const user = email ? await db.user.findUnique({ where: { email } }) : null;
  const valid = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid) {
    const e = attempts.get(email) ?? { count: 0, until: 0 };
    attempts.set(email, { count: e.count + 1, until: Date.now() + LOCK_MS });
    return fail(t.auth.invalidCredentials);
  }
  if (user.status !== "ACTIVE") return fail(t.auth.inactiveAccount);
  attempts.delete(email);

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  if (user.locale && isLocale(user.locale)) {
    (await cookies()).set(LOCALE_COOKIE, user.locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const user = await getCurrentUser();
  if (user) await db.user.update({ where: { id: user.id }, data: { locale } });
  revalidatePath("/", "layout");
}

/** Activate an account or reset a password from a one-time link. */
export async function acceptInvitation(token: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const f = reader(formData);
  const password = f.str("password");
  const confirm = f.str("confirm");
  const name = f.str("name");

  const invitation = await db.invitation.findUnique({ where: { token }, include: { user: true } });
  if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
    return fail(t.auth.invite.invalid);
  }
  const fieldErrors: Record<string, string> = {};
  if (password.length < 8) fieldErrors.password = t.validation.passwordLength;
  if (password !== confirm) fieldErrors.confirm = t.setup.passwordMismatch;
  if (invitation.kind === "INVITE" && !name) fieldErrors.name = t.validation.required;
  if (Object.keys(fieldErrors).length) return fail(t.validation.required, fieldErrors);

  await db.$transaction([
    db.user.update({
      where: { id: invitation.userId },
      data: {
        passwordHash: await hashPassword(password),
        status: "ACTIVE",
        lastLoginAt: new Date(),
        ...(invitation.kind === "INVITE" && name ? { name } : {}),
      },
    }),
    db.invitation.update({ where: { id: invitation.id }, data: { usedAt: new Date() } }),
  ]);
  if (invitation.kind === "INVITE") {
    await logActivity({ actorId: invitation.userId, action: "joined", entityType: "workspace", entityLabel: null });
  }
  await createSession(invitation.userId);
  redirect("/");
}

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const me = await getCurrentUser();
  if (!me) return fail(t.common.notAllowed);
  const f = reader(formData);
  const current = f.str("current");
  const password = f.str("password");
  const confirm = f.str("confirm");
  const user = await db.user.findUnique({ where: { id: me.id } });
  if (!user?.passwordHash || !(await verifyPassword(current, user.passwordHash))) {
    return fail(t.settings.wrongPassword, { current: t.settings.wrongPassword });
  }
  if (password.length < 8) return fail(t.validation.passwordLength, { password: t.validation.passwordLength });
  if (password !== confirm) return fail(t.setup.passwordMismatch, { confirm: t.setup.passwordMismatch });
  await db.user.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(password) } });
  return ok(t.settings.passwordUpdated);
}
