import { NextResponse } from "next/server";
import { getContext } from "@/lib/context";
import { getI18n } from "@/lib/i18n/server";
import { isManager } from "@/lib/permissions";
import { csv } from "@/lib/api";
import { nowWall } from "@/lib/utils";

/** CSV list of members (managers and administrators). */
export async function GET() {
  const ctx = await getContext();
  if (!ctx || !isManager(ctx.user)) return new NextResponse("Forbidden", { status: 403 });
  const { t } = await getI18n();
  const { db, association } = ctx;
  const year = nowWall().getUTCFullYear();
  const members = await db.member.findMany({
    orderBy: { user: { name: "asc" } },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          skills: true,
          poleMemberships: {
            where: { pole: { associationId: association.id } },
            include: { pole: { select: { name: true } } },
          },
          dues: { where: { associationId: association.id, year }, select: { id: true } },
        },
      },
    },
  });
  const body = csv(
    [
      t.common.name,
      t.common.email,
      t.common.phone,
      t.members.role,
      t.members.boardPosition,
      t.members.jobTitle,
      t.common.poles,
      t.members.skills,
      t.members.joinedAt,
      t.members.duesYear(year),
      t.common.status,
    ],
    members.map((m) => [
      m.user.name,
      m.user.email,
      m.user.phone,
      t.enums.role[m.role],
      m.boardPosition ? t.enums.boardPosition[m.boardPosition] : "",
      m.title,
      m.user.poleMemberships
        .map((p) => `${p.pole.name}${p.role === "LEAD" ? ` (${t.enums.poleRole.LEAD})` : ""}`)
        .join(", "),
      m.user.skills,
      m.joinedAt.toISOString().slice(0, 10),
      m.user.dues.length ? t.members.duesPaid : t.members.duesUnpaid,
      t.members.statusLabel[m.status as "ACTIVE" | "INACTIVE"] ?? m.status,
    ]),
  );
  return new NextResponse(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="members.csv"' },
  });
}
