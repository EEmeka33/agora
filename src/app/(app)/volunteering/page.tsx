import type { Metadata } from "next";
import { CalendarClock, Clock, Download, HandHeart, Plus, Trash2, Users } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { requireContext } from "@/lib/context";
import { getI18n } from "@/lib/i18n/server";
import { can } from "@/lib/permissions";
import { getPoleOptions, getProjectOptions } from "@/lib/queries";
import { withParams } from "@/lib/url";
import { formatDate, formatMoney, minutesToHours, nowWall } from "@/lib/utils";
import { colorOf } from "@/lib/colors";
import { deleteTimeEntry, logTime } from "@/actions/volunteering";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, PageHeader, Segmented, StatCard } from "@/components/ui/page";
import { FormDialog } from "@/components/forms/form-dialog";
import { FilterSelect } from "@/components/forms/filters";
import { RowActions } from "@/components/forms/row-actions";
import { TimeFields } from "@/components/volunteering/time-fields";

export const metadata: Metadata = { title: "Volunteering" };

function Bars({
  rows,
  locale,
  hours,
}: {
  rows: { key: string; label: string; minutes: number; color?: string }[];
  locale: string;
  hours: (h: string) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.minutes));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0 font-medium tabular-nums">{hours(minutesToHours(r.minutes, locale))}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-r-[4px] ${r.color ? colorOf(r.color).bar : "bg-primary"}`}
              style={{ width: `${(r.minutes / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function VolunteeringPage(props: PageProps<"/volunteering">) {
  const { user, db, association } = await requireContext();
  const { t, locale } = await getI18n();
  const sp = await props.searchParams;
  const now = nowWall();
  const currentYear = now.getUTCFullYear();
  const year = typeof sp.year === "string" && /^\d{4}$/.test(sp.year) ? Number(sp.year) : currentYear;
  const who = sp.who === "all" ? "all" : "mine";
  const yearRange = { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) };
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const listWhere: Prisma.TimeEntryWhereInput = { date: yearRange, ...(who === "mine" ? { userId: user.id } : {}) };
  const [entries, yearEntries, myMonth, poles, projects, events] = await Promise.all([
    db.timeEntry.findMany({
      where: listWhere,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 200,
      include: {
        user: { select: { id: true, name: true, avatarColor: true } },
        pole: { select: { name: true, color: true } },
        project: { select: { title: true } },
        event: { select: { title: true } },
      },
    }),
    db.timeEntry.findMany({
      where: { date: yearRange },
      select: {
        userId: true,
        minutes: true,
        poleId: true,
        user: { select: { name: true } },
        pole: { select: { name: true, color: true } },
      },
    }),
    db.timeEntry.aggregate({ where: { userId: user.id, date: { gte: monthStart } }, _sum: { minutes: true } }),
    getPoleOptions(db),
    getProjectOptions(db),
    db.event.findMany({
      where: { startAt: { gte: new Date(now.getTime() - 60 * 86_400_000) } },
      orderBy: { startAt: "desc" },
      take: 30,
      select: { id: true, title: true },
    }),
  ]);

  const total = yearEntries.reduce((s, e) => s + e.minutes, 0);
  const mine = yearEntries.filter((e) => e.userId === user.id).reduce((s, e) => s + e.minutes, 0);
  const byMember = Object.values(
    yearEntries.reduce<Record<string, { key: string; label: string; minutes: number }>>((acc, e) => {
      acc[e.userId] ??= { key: e.userId, label: e.user.name, minutes: 0 };
      acc[e.userId].minutes += e.minutes;
      return acc;
    }, {}),
  ).sort((a, b) => b.minutes - a.minutes);
  const byPole = Object.values(
    yearEntries.reduce<Record<string, { key: string; label: string; minutes: number; color?: string }>>((acc, e) => {
      const k = e.poleId ?? "none";
      acc[k] ??= { key: k, label: e.pole?.name ?? t.volunteering.noPole, minutes: 0, color: e.pole?.color ?? "slate" };
      acc[k].minutes += e.minutes;
      return acc;
    }, {}),
  ).sort((a, b) => b.minutes - a.minutes);
  const hours = (m: number) => t.volunteering.hours(minutesToHours(m, locale));
  const value = association.volunteerHourCents ? Math.round((total / 60) * association.volunteerHourCents) : null;
  const qs = (patch: Record<string, string | null>) => withParams("/volunteering", sp, patch);

  return (
    <>
      <PageHeader
        title={t.volunteering.title}
        description={t.volunteering.subtitle}
        actions={
          <>
            <a href={`/api/export/volunteering?year=${year}`} className={buttonVariants({ variant: "outline" })}>
              <Download /> {t.volunteering.exportCsv}
            </a>
            <FormDialog
              title={t.volunteering.log}
              action={logTime}
              submitLabel={t.common.save}
              defaultOpen={sp.new === "1"}
              trigger={
                <Button>
                  <Plus /> {t.volunteering.log}
                </Button>
              }
            >
              <TimeFields
                poles={poles}
                projects={projects.map((p) => ({ id: p.id, name: p.title }))}
                events={events.map((e) => ({ id: e.id, name: e.title }))}
              />
            </FormDialog>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.volunteering.myMonth} value={hours(myMonth._sum.minutes ?? 0)} icon={<Clock />} />
        <StatCard label={t.volunteering.myYear(year)} value={hours(mine)} icon={<CalendarClock />} />
        <StatCard
          label={t.volunteering.total(year)}
          value={hours(total)}
          hint={t.common.countMembers(byMember.length)}
          icon={<Users />}
        />
        <StatCard
          label={t.volunteering.value}
          value={value !== null ? formatMoney(value, association.currency, locale) : "—"}
          hint={value === null ? t.volunteering.valueHint : undefined}
          icon={<HandHeart />}
        />
      </div>

      {total > 0 && (
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t.volunteering.byMember}</CardTitle>
            </CardHeader>
            <CardContent>
              <Bars rows={byMember.slice(0, 10)} locale={locale} hours={t.volunteering.hours} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.volunteering.byPole}</CardTitle>
            </CardHeader>
            <CardContent>
              <Bars rows={byPole} locale={locale} hours={t.volunteering.hours} />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented
          items={[
            { href: qs({ who: null }), label: t.volunteering.mine, active: who === "mine" },
            { href: qs({ who: "all" }), label: t.volunteering.everyone, active: who === "all" },
          ]}
        />
        <FilterSelect
          param="year"
          placeholder={String(currentYear)}
          options={[currentYear - 1, currentYear - 2].map((y) => ({ value: String(y), label: String(y) }))}
        />
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={<Clock />} title={t.volunteering.empty} description={t.volunteering.subtitle} />
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card card-shadow">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <Avatar name={e.user.name} color={e.user.avatarColor} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {e.description ?? e.project?.title ?? e.event?.title ?? e.pole?.name ?? "—"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {e.user.name} · {formatDate(e.date, locale)}
                  {e.project && ` · ${e.project.title}`}
                  {e.event && ` · ${e.event.title}`}
                </p>
              </div>
              {e.pole && (
                <Badge color={e.pole.color} className="hidden sm:inline-flex">
                  {e.pole.name}
                </Badge>
              )}
              <span className="w-16 text-right font-semibold tabular-nums">{hours(e.minutes)}</span>
              {can.deleteTimeEntry(user, e) && (
                <RowActions
                  items={[
                    {
                      kind: "confirm",
                      label: t.common.delete,
                      icon: <Trash2 />,
                      title: t.common.confirmDelete,
                      action: deleteTimeEntry.bind(null, e.id),
                      destructive: true,
                    },
                  ]}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
