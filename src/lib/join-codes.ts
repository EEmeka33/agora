import "server-only";
import { db } from "./db";
import { notify } from "./notifications";

export type RedeemResult =
  | { ok: true; associationId: string; name: string }
  | { ok: false; reason: "invalid" | "already" | "inactive"; associationId?: string };

/** Looks up a code that can still be used (not revoked, not expired, uses left). */
export async function findUsableCode(code: string) {
  const jc = await db.joinCode.findUnique({
    where: { code },
    include: { association: { select: { id: true, name: true, locale: true } } },
  });
  if (!jc || jc.revokedAt || (jc.expiresAt && jc.expiresAt < new Date()) || jc.uses >= jc.maxUses) return null;
  return jc;
}

/**
 * Adds an account to the association of a join code, consuming one use atomically.
 * Never exported as a server action: callers must pass the *signed-in* account id.
 */
export async function redeemJoinCode(userId: string, code: string): Promise<RedeemResult> {
  const jc = await findUsableCode(code);
  if (!jc) return { ok: false, reason: "invalid" };

  const existing = await db.member.findUnique({
    where: { associationId_userId: { associationId: jc.associationId, userId } },
  });
  if (existing) {
    return {
      ok: false,
      reason: existing.status === "ACTIVE" ? "already" : "inactive",
      associationId: jc.associationId,
    };
  }

  // Consume one use only if some are left (safe against two people using the last one at once).
  const consumed = await db.joinCode.updateMany({
    where: { id: jc.id, uses: { lt: jc.maxUses }, revokedAt: null },
    data: { uses: { increment: 1 } },
  });
  if (consumed.count === 0) return { ok: false, reason: "invalid" };

  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } });
  await db.member.create({ data: { associationId: jc.associationId, userId, role: jc.role } });
  if (jc.poleId) {
    await db.poleMember.upsert({
      where: { poleId_userId: { poleId: jc.poleId, userId } },
      create: { poleId: jc.poleId, userId },
      update: {},
    });
  }
  await db.activity.create({
    data: {
      associationId: jc.associationId,
      actorId: userId,
      action: "joined",
      entityType: "workspace",
      entityLabel: jc.association.name,
    },
  });
  const admins = await db.member.findMany({
    where: { associationId: jc.associationId, role: { in: ["ADMIN", "MANAGER"] }, status: "ACTIVE" },
    select: { userId: true },
  });
  await notify(
    { user: { id: userId, name: user.name }, association: jc.association },
    { userIds: admins.map((a) => a.userId), type: "member.joined", link: `/members/${userId}` },
  );
  return { ok: true, associationId: jc.associationId, name: jc.association.name };
}
