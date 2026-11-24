"use server";

import { db } from "@/lib/db";
import { ensure, fail, ok, reader, withUser, type ActionState } from "@/lib/action-utils";
import { PAYMENT_METHODS, TRANSACTION_CATEGORIES, TRANSACTION_TYPES } from "@/lib/constants";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import type { Dictionary } from "@/lib/i18n/dictionaries";

function readTransaction(fd: FormData) {
  const f = reader(fd);
  return {
    label: f.str("label"),
    type: f.oneOf("type", TRANSACTION_TYPES, "EXPENSE"),
    amountCents: f.money("amount"),
    category: f.oneOf("category", TRANSACTION_CATEGORIES as readonly string[], "OTHER"),
    date: f.date("date"),
    paymentMethod: f.optOneOf("paymentMethod", PAYMENT_METHODS),
    reference: f.opt("reference"),
    notes: f.opt("notes"),
    projectId: f.opt("projectId"),
    poleId: f.opt("poleId"),
  };
}

function validate(data: ReturnType<typeof readTransaction>, t: Dictionary) {
  const errors: Record<string, string> = {};
  if (!data.label) errors.label = t.validation.required;
  if (data.amountCents === null || data.amountCents <= 0) errors.amount = t.validation.invalidAmount;
  if (!data.date) errors.date = t.validation.invalidDate;
  return Object.keys(errors).length ? fail(t.validation.required, errors) : null;
}

export async function createTransaction(_prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    ensure(can.manageFinance(user), t);
    const data = readTransaction(fd);
    const invalid = validate(data, t);
    if (invalid) return invalid;
    const tx = await db.transaction.create({
      data: { ...data, amountCents: data.amountCents!, date: data.date!, recordedById: user.id },
    });
    await logActivity({
      actorId: user.id,
      action: "created",
      entityType: "transaction",
      entityId: tx.id,
      entityLabel: tx.label,
    });
    return ok(t.common.created);
  });
}

export async function updateTransaction(id: string, _prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    ensure(can.manageFinance(user), t);
    const data = readTransaction(fd);
    const invalid = validate(data, t);
    if (invalid) return invalid;
    await db.transaction.update({ where: { id }, data: { ...data, amountCents: data.amountCents!, date: data.date! } });
    await logActivity({
      actorId: user.id,
      action: "updated",
      entityType: "transaction",
      entityId: id,
      entityLabel: data.label,
    });
    return ok(t.common.saved);
  });
}

export async function deleteTransaction(id: string) {
  return withUser(async ({ user, t }) => {
    ensure(can.manageFinance(user), t);
    const tx = await db.transaction.delete({ where: { id } });
    await logActivity({ actorId: user.id, action: "deleted", entityType: "transaction", entityLabel: tx.label });
    return ok(t.common.deleted);
  });
}

/** Records a member's yearly fee and the matching income transaction. */
export async function recordMembership(_prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    ensure(can.manageFinance(user), t);
    const f = reader(fd);
    const userId = f.str("userId");
    const year = f.int("year", new Date().getFullYear());
    const amountCents = f.money("amount");
    const paidAt = f.date("paidAt") ?? new Date();
    const method = f.optOneOf("method", PAYMENT_METHODS);
    const errors: Record<string, string> = {};
    if (!userId) errors.userId = t.validation.required;
    if (amountCents === null || amountCents < 0) errors.amount = t.validation.invalidAmount;
    if (Object.keys(errors).length) return fail(t.validation.required, errors);
    const member = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
    if (!member) return fail(t.common.notFound);
    if (await db.membership.findUnique({ where: { userId_year: { userId, year } } })) {
      return fail(t.finance.alreadyPaid, { userId: t.finance.alreadyPaid });
    }
    await db.$transaction(async (tx) => {
      const transaction = amountCents
        ? await tx.transaction.create({
            data: {
              label: `${t.enums.category.MEMBERSHIP} ${year} — ${member.name}`,
              type: "INCOME",
              category: "MEMBERSHIP",
              amountCents: amountCents!,
              date: paidAt,
              paymentMethod: method,
              recordedById: user.id,
            },
          })
        : null;
      await tx.membership.create({
        data: { userId, year, amountCents: amountCents!, paidAt, method, transactionId: transaction?.id },
      });
    });
    await logActivity({
      actorId: user.id,
      action: "paid",
      entityType: "membership",
      entityId: userId,
      entityLabel: member.name,
    });
    return ok(t.common.saved);
  });
}

export async function deleteMembership(id: string) {
  return withUser(async ({ user, t }) => {
    ensure(can.manageFinance(user), t);
    const membership = await db.membership.findUnique({ where: { id } });
    if (!membership) return fail(t.common.notFound);
    await db.$transaction(async (tx) => {
      await tx.membership.delete({ where: { id } });
      if (membership.transactionId) await tx.transaction.delete({ where: { id: membership.transactionId } });
    });
    return ok(t.common.deleted);
  });
}
