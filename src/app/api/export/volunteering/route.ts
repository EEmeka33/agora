import { NextResponse, type NextRequest } from "next/server";
import { getContext } from "@/lib/context";
import { getI18n } from "@/lib/i18n/server";
import { csv } from "@/lib/api";

/** CSV of volunteer time for a year (?year=2026). */
export async function GET(request: NextRequest) {
  const ctx = await getContext();
  if (!ctx) return new NextResponse("Unauthorized", { status: 401 });
  const { t } = await getI18n();
  const year = Number(request.nextUrl.searchParams.get("year")) || new Date().getFullYear();
  const rows = await ctx.db.timeEntry.findMany({
    where: { date: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } },
    orderBy: { date: "asc" },
    include: {
      user: { select: { name: true } },
      pole: { select: { name: true } },
      project: { select: { title: true } },
      event: { select: { title: true } },
    },
  });
  const body = csv(
    [
      t.common.date,
      t.common.member,
      t.volunteering.duration,
      t.common.description,
      t.common.pole,
      t.common.project,
      t.nav.events,
    ],
    rows.map((r) => [
      r.date.toISOString().slice(0, 10),
      r.user.name,
      (r.minutes / 60).toFixed(2),
      r.description,
      r.pole?.name,
      r.project?.title,
      r.event?.title,
    ]),
  );
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="volunteering-${year}.csv"`,
    },
  });
}
