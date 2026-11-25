import "server-only";
import type { TenantDb } from "./tenant";

/** Active members, for "assign to" pickers. */
export async function getMemberOptions(db: TenantDb) {
  const members = await db.member.findMany({
    where: { status: "ACTIVE" },
    include: { user: { select: { id: true, name: true, avatarColor: true } } },
    orderBy: { user: { name: "asc" } },
  });
  return members.map((m) => m.user);
}

export function getPoleOptions(db: TenantDb) {
  return db.pole.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, color: true, icon: true },
  });
}

export function getProjectOptions(db: TenantDb) {
  return db.project.findMany({
    where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
    orderBy: { title: "asc" },
    select: { id: true, title: true, poleId: true },
  });
}

export function getAllProjectOptions(db: TenantDb) {
  return db.project.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, poleId: true } });
}

/** Ids of the leads of a pole. */
export async function poleLeadIds(db: TenantDb, poleId: string | null | undefined) {
  if (!poleId) return [];
  const leads = await db.poleMember.findMany({ where: { poleId, role: "LEAD" }, select: { userId: true } });
  return leads.map((l) => l.userId);
}

/** Ids of the poles the user belongs to. */
export async function myPoleIds(db: TenantDb, userId: string) {
  const rows = await db.poleMember.findMany({ where: { userId }, select: { poleId: true } });
  return rows.map((r) => r.poleId);
}
