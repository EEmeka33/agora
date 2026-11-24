import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, Link2, Pencil, Power, Trash2, User, Users } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { withParams } from "@/lib/url";
import { getI18n } from "@/lib/i18n/server";
import { can, isAdmin } from "@/lib/permissions";
import { getPoleOptions } from "@/lib/queries";
import { ROLES } from "@/lib/constants";
import { colorFor } from "@/lib/colors";
import { nowWall, pct } from "@/lib/utils";
import { createInviteLink, deleteMember, setMemberStatus, updateMember } from "@/actions/members";
import { EmptyState, PageHeader, Segmented, StatCard } from "@/components/ui/page";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FilterSelect, SearchInput } from "@/components/forms/filters";
import { RowActions, type RowAction } from "@/components/forms/row-actions";
import { MemberFields } from "@/components/members/member-fields";
import { NewMemberDialog } from "@/components/members/new-member-dialog";
import { memberValues } from "@/components/members/member-values";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage(props: PageProps<"/members">) {
  const user = await requireUser();
  const { t } = await getI18n();
  const sp = await props.searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const status = get("status") === "inactive" ? "INACTIVE" : "ACTIVE";
  const year = nowWall().getUTCFullYear();

  const where: Prisma.UserWhereInput = { status };
  if (get("q"))
    where.OR = [{ name: { contains: get("q") } }, { email: { contains: get("q") } }, { title: { contains: get("q") } }];
  if (get("pole")) where.poleMemberships = { some: { poleId: get("pole") } };
  if (ROLES.includes(get("role") as never)) where.role = get("role");

  const [members, poles, activeCount, withAccount, paidCount] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        poleMemberships: { include: { pole: { select: { id: true, name: true, color: true } } } },
        memberships: { where: { year }, select: { id: true } },
        invitations: {
          where: { usedAt: null, kind: "INVITE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { expiresAt: true },
        },
      },
    }),
    getPoleOptions(),
    db.user.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { status: "ACTIVE", passwordHash: { not: null } } }),
    db.membership.count({ where: { year, user: { status: "ACTIVE" } } }),
  ]);
  const admin = isAdmin(user);
  const qs = (patch: Record<string, string | null>) => withParams("/members", sp, patch);

  return (
    <>
      <PageHeader
        title={t.members.title}
        description={t.members.subtitle}
        actions={admin && <NewMemberDialog poles={poles} defaultOpen={get("new") === "1"} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t.members.stats.active} value={activeCount} icon={<Users />} />
        <StatCard label={t.members.stats.accounts} value={`${withAccount}/${activeCount}`} icon={<KeyRound />} />
        <StatCard
          label={t.members.stats.dues(year)}
          value={`${pct(paidCount, activeCount)}%`}
          hint={`${paidCount}/${activeCount}`}
          icon={<User />}
          href="/finance?tab=dues"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented
          items={[
            { href: qs({ status: null }), label: t.members.statusLabel.ACTIVE, active: status === "ACTIVE" },
            { href: qs({ status: "inactive" }), label: t.members.statusLabel.INACTIVE, active: status === "INACTIVE" },
          ]}
        />
        <SearchInput placeholder={t.common.searchPlaceholder} className="w-full sm:w-60" />
        <FilterSelect
          param="pole"
          placeholder={t.common.pole}
          options={poles.map((p) => ({ value: p.id, label: p.name }))}
        />
        <FilterSelect
          param="role"
          placeholder={t.members.role}
          options={ROLES.map((r) => ({ value: r, label: t.enums.role[r] }))}
        />
      </div>

      {members.length === 0 ? (
        <EmptyState icon={<Users />} title={t.members.emptyTitle} />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card card-shadow">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">{t.common.member}</th>
                  <th className="px-3 py-2.5 font-medium">{t.members.boardPosition}</th>
                  <th className="px-3 py-2.5 font-medium">{t.common.poles}</th>
                  <th className="px-3 py-2.5 font-medium">{t.members.duesYear(year)}</th>
                  <th className="px-3 py-2.5 font-medium">{t.members.account}</th>
                  <th className="w-12 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {members.map((m) => {
                  const pending = m.invitations[0] && m.invitations[0].expiresAt > new Date();
                  const items: RowAction[] = [
                    { kind: "link", label: t.members.profile, icon: <User />, href: `/members/${m.id}` },
                  ];
                  if (can.editProfile(user, m.id)) {
                    items.push({
                      kind: "dialog",
                      label: t.common.edit,
                      icon: <Pencil />,
                      title: t.members.editMember,
                      action: updateMember.bind(null, m.id),
                      size: "lg",
                      content: <MemberFields member={memberValues(m)} adminFields={admin} />,
                    });
                  }
                  if (admin) {
                    items.push(
                      m.passwordHash
                        ? {
                            kind: "run",
                            label: t.members.resetPassword,
                            icon: <KeyRound />,
                            action: createInviteLink.bind(null, m.id, "RESET"),
                          }
                        : {
                            kind: "run",
                            label: t.members.invite,
                            icon: <Link2 />,
                            action: createInviteLink.bind(null, m.id, "INVITE"),
                          },
                    );
                    if (m.id !== user.id) {
                      items.push(
                        { kind: "separator" },
                        m.status === "ACTIVE"
                          ? {
                              kind: "run",
                              label: t.members.deactivate,
                              icon: <Power />,
                              action: setMemberStatus.bind(null, m.id, "INACTIVE"),
                            }
                          : {
                              kind: "run",
                              label: t.members.reactivate,
                              icon: <Power />,
                              action: setMemberStatus.bind(null, m.id, "ACTIVE"),
                            },
                        {
                          kind: "confirm",
                          label: t.common.delete,
                          icon: <Trash2 />,
                          title: t.members.deleteMember,
                          description: t.members.deleteWarning,
                          action: deleteMember.bind(null, m.id),
                          destructive: true,
                        },
                      );
                    }
                  }
                  return (
                    <tr key={m.id} className="hover:bg-hover/40">
                      <td className="px-4 py-3">
                        <Link href={`/members/${m.id}`} className="flex items-center gap-3">
                          <Avatar name={m.name} color={m.avatarColor} />
                          <span className="min-w-0">
                            <span className="block truncate font-medium hover:underline">
                              {m.name}{" "}
                              {m.id === user.id && (
                                <span className="font-normal text-muted-foreground">({t.common.you})</span>
                              )}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">{m.title ?? m.email}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {m.boardPosition && <Badge color="indigo">{t.enums.boardPosition[m.boardPosition]}</Badge>}
                          {m.role !== "MEMBER" && (
                            <Badge color={colorFor("role", m.role)}>{t.enums.role[m.role]}</Badge>
                          )}
                          {!m.boardPosition && m.role === "MEMBER" && <span className="text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex max-w-64 flex-wrap gap-1">
                          {m.poleMemberships.map((pm) => (
                            <Badge key={pm.poleId} color={pm.pole.color}>
                              {pm.role === "LEAD" && "★ "}
                              {pm.pole.name}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {m.memberships.length ? (
                          <Badge color="emerald" dot>
                            {t.members.duesPaid}
                          </Badge>
                        ) : (
                          <Badge color="amber" dot>
                            {t.members.duesUnpaid}
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {m.passwordHash ? (
                          <span className="text-success">● {t.members.accountActive}</span>
                        ) : pending ? (
                          <span className="text-warning">● {t.members.accountPending}</span>
                        ) : (
                          <span className="text-muted-foreground">○ {t.members.accountNone}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <RowActions items={items} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
