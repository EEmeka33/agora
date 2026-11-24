"use server";

import { db } from "@/lib/db";
import { ensure, fail, ok, reader, withUser, type ActionState } from "@/lib/action-utils";
import { ACCENTS, CURRENCIES, LOCALES } from "@/lib/constants";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { clamp } from "@/lib/utils";

export async function updateAssociation(_prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    ensure(can.manageAssociation(user), t);
    const f = reader(fd);
    const name = f.str("name");
    if (!name) return fail(t.validation.required, { name: t.validation.required });
    const data = {
      name,
      shortName: f.opt("shortName"),
      tagline: f.opt("tagline"),
      purpose: f.opt("purpose"),
      legalForm: f.str("legalForm") || "Loi 1901",
      registrationNumber: f.opt("registrationNumber"),
      siret: f.opt("siret"),
      foundedAt: f.date("foundedAt"),
      email: f.opt("email"),
      phone: f.opt("phone"),
      website: f.opt("website"),
      address: f.opt("address"),
      postalCode: f.opt("postalCode"),
      city: f.opt("city"),
      country: f.opt("country"),
      accentColor: f.oneOf("accentColor", ACCENTS, "indigo"),
      locale: f.oneOf("locale", LOCALES, "en"),
      currency: f.oneOf("currency", CURRENCIES, "EUR"),
      membershipFeeCents: f.money("membershipFee"),
      fiscalYearStartMonth: clamp(f.int("fiscalYearStartMonth", 1), 1, 12),
    };
    const existing = await db.association.findFirst();
    if (existing) await db.association.update({ where: { id: existing.id }, data });
    else await db.association.create({ data });
    await logActivity({ actorId: user.id, action: "updated", entityType: "association", entityLabel: name });
    return ok(t.common.saved);
  });
}
