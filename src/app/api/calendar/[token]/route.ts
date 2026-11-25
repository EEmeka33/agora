import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { sha256 } from "@/lib/tokens";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
// Dates are stored as wall time: export them as "floating" local times (no Z).
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").slice(0, 15);

/** Private iCalendar feed with the events of all the person's associations. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/calendar/[token]">) {
  await connection();
  const { token } = await ctx.params;
  const clean = token.replace(/\.ics$/, "");
  const user = /^[A-Za-z0-9_-]{40,60}$/.test(clean)
    ? await db.user.findUnique({ where: { calendarTokenHash: sha256(clean) }, select: { id: true } })
    : null;
  if (!user) return new NextResponse("Not found", { status: 404 });

  const since = new Date(Date.now() - 60 * 86_400_000);
  const events = await db.event.findMany({
    where: { startAt: { gte: since }, association: { members: { some: { userId: user.id, status: "ACTIVE" } } } },
    include: { association: { select: { name: true } } },
    orderBy: { startAt: "asc" },
    take: 1000,
  });
  const origin = request.nextUrl.origin;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agora//Association calendar//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Agora",
    ...events.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:${e.id}@agora`,
      `DTSTAMP:${stamp(e.updatedAt)}Z`,
      `DTSTART:${stamp(e.startAt)}`,
      `DTEND:${stamp(e.endAt ?? new Date(e.startAt.getTime() + 3600_000))}`,
      `SUMMARY:${esc(`${e.title} · ${e.association.name}`)}`,
      ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
      `DESCRIPTION:${esc([e.description, e.agenda].filter(Boolean).join("\n\n"))}`,
      `URL:${origin}/events/${e.id}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return new NextResponse(lines.join("\r\n"), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "private, max-age=300" },
  });
}
