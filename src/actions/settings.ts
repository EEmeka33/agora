"use server";

import { ensure, fail, ok, reader, withUser, type ActionState } from "@/lib/action-utils";
import { ACCENTS, CURRENCIES, LOCALES } from "@/lib/constants";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { db as globalDb } from "@/lib/db";
import { clamp } from "@/lib/utils";

export async function updateAssociation(_prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, association } = ctx;
    ensure(can.manageAssociation(user), t);
    const f = reader(fd);
    const name = f.str("name");
    if (!name) return fail(t.validation.required, { name: t.validation.required });
    await globalDb.association.update({
      where: { id: association.id },
      data: {
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
        volunteerHourCents: f.money("volunteerHour"),
        fiscalYearStartMonth: clamp(f.int("fiscalYearStartMonth", 1), 1, 12),
      },
    });
    await logActivity(ctx, { actorId: user.id, action: "updated", entityType: "association", entityLabel: name });
    return ok(t.common.saved);
  });
}
