import type { Metadata } from "next";
import { Bell, CheckCheck } from "lucide-react";
import { db as globalDb } from "@/lib/db";
import { requireContext } from "@/lib/context";
import { getI18n } from "@/lib/i18n/server";
import { renderNotification } from "@/lib/notifications";
import { cn, formatRelative } from "@/lib/utils";
import { markAllNotificationsRead, openNotification } from "@/actions/notifications";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/page";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { user, association } = await requireContext();
  const { t, locale } = await getI18n();
  const items = await globalDb.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { association: { select: { name: true } }, actor: { select: { name: true, avatarColor: true } } },
  });
  const unread = items.some((n) => !n.readAt);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t.notifications.title}
        description={t.notifications.subtitle}
        actions={
          unread && (
            <form action={markAllNotificationsRead}>
              <Button type="submit" variant="outline">
                <CheckCheck /> {t.notifications.markAllRead}
              </Button>
            </form>
          )
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={<Bell />} title={t.notifications.empty} />
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card card-shadow">
          {items.map((n) => (
            <li key={n.id}>
              <form action={openNotification.bind(null, n.id)}>
                <button
                  type="submit"
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-hover/60",
                    !n.readAt && "bg-primary-soft/30",
                  )}
                >
                  <Avatar name={n.actor?.name ?? "A"} color={n.actor?.avatarColor ?? "slate"} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm">
                      {renderNotification(n.type, JSON.parse(n.data || "{}"), locale)}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatRelative(n.createdAt, locale)}
                      {n.association && n.association.name !== association.name && ` · ${n.association.name}`}
                    </span>
                  </span>
                  {!n.readAt && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
