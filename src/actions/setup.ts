"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { getI18n, LOCALE_COOKIE } from "@/lib/i18n/server";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { EMAIL_RE, fail, reader, type ActionState } from "@/lib/action-utils";
import { BOARD_POSITIONS, CURRENCIES, LOCALES } from "@/lib/constants";
import { foundationSteps } from "@/lib/foundation-template";
import { logActivity } from "@/lib/activity";

const SUGGESTED_POLES = {
  communication: { color: "rose", icon: "megaphone" },
  events: { color: "amber", icon: "calendar" },
  partnerships: { color: "teal", icon: "handshake" },
  treasury: { color: "emerald", icon: "wallet" },
  members: { color: "violet", icon: "users" },
  projects: { color: "sky", icon: "leaf" },
} as const;

export async function setupWorkspace(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t: currentT } = await getI18n();
  if ((await db.user.count()) > 0) return fail(currentT.setup.alreadyDone);

  const f = reader(formData);
  const locale = f.oneOf("locale", LOCALES, "en");
  const t = dictionaries[locale];
  const name = f.str("name");
  const adminName = f.str("adminName");
  const email = f.str("email").toLowerCase();
  const password = f.str("password");
  const confirm = f.str("confirm");

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = t.validation.required;
  if (!adminName) fieldErrors.adminName = t.validation.required;
  if (!EMAIL_RE.test(email)) fieldErrors.email = t.validation.email;
  if (password.length < 8) fieldErrors.password = t.validation.passwordLength;
  if (password !== confirm) fieldErrors.confirm = t.setup.passwordMismatch;
  if (Object.keys(fieldErrors).length) return fail(t.validation.required, fieldErrors);

  const poleKeys = f.all("poles").filter((k): k is keyof typeof SUGGESTED_POLES => k in SUGGESTED_POLES);

  const user = await db.$transaction(async (tx) => {
    await tx.association.create({
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
    const admin = await tx.user.create({
      data: {
        name: adminName,
        email,
        passwordHash: await hashPassword(password),
        role: "ADMIN",
        boardPosition: f.optOneOf("boardPosition", BOARD_POSITIONS),
        avatarColor: "indigo",
        locale,
        lastLoginAt: new Date(),
      },
    });
    if (f.bool("checklist")) {
      await tx.foundationStep.createMany({ data: foundationSteps(locale) });
    }
    for (const [i, key] of poleKeys.entries()) {
      await tx.pole.create({
        data: {
          name: t.setup.suggestedPoles[key],
          color: SUGGESTED_POLES[key].color,
          icon: SUGGESTED_POLES[key].icon,
          order: i,
          members: { create: { userId: admin.id, role: "LEAD" } },
        },
      });
    }
    return admin;
  });

  await logActivity({ actorId: user.id, action: "created", entityType: "workspace", entityLabel: name });
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  await createSession(user.id);
  redirect("/foundation");
}
