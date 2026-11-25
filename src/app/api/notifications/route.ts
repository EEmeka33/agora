import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAccount } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { renderNotification } from "@/lib/notifications";

/** Unread count (and latest notifications with ?limit=N) for the bell in the top bar. */
export async function GET(request: NextRequest) {
  const account = await getAccount();
  if (!account) return NextResponse.json({ unread: 0, items: [] }, { status: 401 });
  const limit = Math.min(30, Number(request.nextUrl.searchParams.get("limit")) || 0);
  const { locale } = await getI18n();
  const [unread, rows] = await Promise.all([
    db.notification.count({ where: { userId: account.id, readAt: null } }),
    limit
      ? db.notification.findMany({
          where: { userId: account.id },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: { association: { select: { name: true } }, actor: { select: { name: true, avatarColor: true } } },
        })
      : Promise.resolve([]),
  ]);
  const items = rows.map((n) => ({
    id: n.id,
    type: n.type,
    message: renderNotification(n.type, JSON.parse(n.data || "{}"), locale),
    association: n.association?.name ?? null,
    actor: n.actor,
    read: !!n.readAt,
    createdAt: n.createdAt.toISOString(),
  }));
  return NextResponse.json({ unread, items }, { headers: { "Cache-Control": "no-store" } });
}
