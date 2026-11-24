import "server-only";
import { cache } from "react";
import { db } from "./db";

export const getAssociation = cache(async () => {
  const association = await db.association.findFirst();
  return (
    association ?? {
      id: "",
      name: "Agora",
      currency: "EUR",
      accentColor: "indigo",
      membershipFeeCents: null as number | null,
      legalForm: "",
      fiscalYearStartMonth: 1,
    }
  );
});

/** Options for "assign to" pickers. */
export const getMemberOptions = cache(async () => {
  const users = await db.user.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, avatarColor: true },
  });
  return users;
});

export const getPoleOptions = cache(async () =>
  db.pole.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, color: true, icon: true },
  }),
);

export const getProjectOptions = cache(async () =>
  db.project.findMany({
    where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
    orderBy: { title: "asc" },
    select: { id: true, title: true, poleId: true },
  }),
);

export const getAllProjectOptions = cache(async () =>
  db.project.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, poleId: true } }),
);

/** Ids of the leads of a pole. */
export async function poleLeadIds(poleId: string | null | undefined) {
  if (!poleId) return [];
  const leads = await db.poleMember.findMany({ where: { poleId, role: "LEAD" }, select: { userId: true } });
  return leads.map((l) => l.userId);
}
