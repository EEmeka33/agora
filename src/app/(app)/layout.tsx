import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";
import { isAdmin, isManager } from "@/lib/permissions";
import { MobileNavProvider, Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { DocumentSync } from "@/components/layout/theme";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/page";
import Link from "next/link";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { locale, t } = await getI18n();
  const [association, openTasks, steps] = await Promise.all([
    db.association.findFirst(),
    db.task.count({ where: { assigneeId: user.id, status: { not: "DONE" } } }),
    db.foundationStep.groupBy({ by: ["status"], _count: true }),
  ]);
  const relevant = steps.filter((s) => s.status !== "SKIPPED").reduce((n, s) => n + s._count, 0);
  const done = steps.find((s) => s.status === "DONE")?._count ?? 0;

  return (
    <I18nProvider locale={locale}>
      <DocumentSync accent={association?.accentColor ?? "indigo"} locale={locale} />
      <MobileNavProvider>
        <div className="flex min-h-dvh">
          <Sidebar
            association={{ name: association?.name ?? "Agora", legalForm: association?.legalForm ?? "" }}
            badges={{
              tasks: openTasks,
              foundation: relevant > 0 && done < relevant ? `${done}/${relevant}` : undefined,
            }}
            footer={
              <Link
                href={`/members/${user.id}`}
                className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-hover"
              >
                <Avatar name={user.name} color={user.avatarColor} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{user.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {user.boardPosition ? t.enums.boardPosition[user.boardPosition] : t.enums.role[user.role]}
                  </span>
                </span>
              </Link>
            }
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar
              user={{ id: user.id, name: user.name, email: user.email, avatarColor: user.avatarColor, role: user.role }}
              canManage={isManager(user)}
              isAdmin={isAdmin(user)}
            />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
          </div>
        </div>
      </MobileNavProvider>
      <CommandPalette />
    </I18nProvider>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar p-4 lg:block">
        <Skeleton className="mb-6 h-9 w-40" />
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      </aside>
      <div className="flex-1">
        <div className="h-14 border-b" />
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
