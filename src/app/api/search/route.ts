import { NextResponse, type NextRequest } from "next/server";
import { getContext } from "@/lib/context";

export async function GET(request: NextRequest) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ results: [] }, { status: 401 });
  const { db } = ctx;
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const contains = { contains: q };
  const [projects, tasks, members, poles, events, documents, requests] = await Promise.all([
    db.project.findMany({
      where: { title: contains },
      take: 5,
      select: { id: true, title: true, pole: { select: { name: true } } },
    }),
    db.task.findMany({
      where: { title: contains },
      take: 6,
      select: { id: true, title: true, project: { select: { title: true } } },
    }),
    db.member.findMany({
      where: { OR: [{ user: { name: contains } }, { user: { email: contains } }, { title: contains }] },
      take: 5,
      select: { title: true, user: { select: { id: true, name: true } } },
    }),
    db.pole.findMany({ where: { name: contains }, take: 4, select: { id: true, name: true } }),
    db.event.findMany({
      where: { title: contains },
      take: 4,
      orderBy: { startAt: "desc" },
      select: { id: true, title: true, startAt: true },
    }),
    db.document.findMany({ where: { title: contains }, take: 4, select: { id: true, title: true } }),
    db.request.findMany({
      where: { title: contains },
      take: 4,
      select: { id: true, title: true, pole: { select: { name: true } } },
    }),
  ]);

  const results = [
    ...projects.map((p) => ({
      type: "projects",
      id: p.id,
      title: p.title,
      subtitle: p.pole?.name,
      href: `/projects/${p.id}`,
    })),
    ...tasks.map((t) => ({
      type: "tasks",
      id: t.id,
      title: t.title,
      subtitle: t.project?.title,
      href: `/tasks/${t.id}`,
    })),
    ...requests.map((r) => ({
      type: "requests",
      id: r.id,
      title: r.title,
      subtitle: r.pole.name,
      href: `/requests/${r.id}`,
    })),
    ...members.map((m) => ({
      type: "members",
      id: m.user.id,
      title: m.user.name,
      subtitle: m.title ?? undefined,
      href: `/members/${m.user.id}`,
    })),
    ...poles.map((p) => ({ type: "poles", id: p.id, title: p.name, href: `/poles/${p.id}` })),
    ...events.map((e) => ({
      type: "events",
      id: e.id,
      title: e.title,
      subtitle: e.startAt.toISOString().slice(0, 10),
      href: `/events/${e.id}`,
    })),
    ...documents.map((d) => ({
      type: "documents",
      id: d.id,
      title: d.title,
      href: `/documents?q=${encodeURIComponent(d.title)}`,
    })),
  ];
  return NextResponse.json({ results });
}
