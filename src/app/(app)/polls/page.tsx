import type { Metadata } from "next";
import { Plus, Vote } from "lucide-react";
import { requireContext } from "@/lib/context";
import { getI18n } from "@/lib/i18n/server";
import { can } from "@/lib/permissions";
import { getPoleOptions, myPoleIds } from "@/lib/queries";
import { createPoll } from "@/actions/polls";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/forms/form-dialog";
import { PollFields } from "@/components/polls/poll-fields";
import { PollCard, type PollCardData } from "@/components/polls/poll-card";

export const metadata: Metadata = { title: "Votes" };

export default async function PollsPage(props: PageProps<"/polls">) {
  const { user, db } = await requireContext();
  const { t } = await getI18n();
  const sp = await props.searchParams;
  const now = new Date();
  const [polls, poles, poleIds, memberCount] = await Promise.all([
    db.poll.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        createdBy: { select: { name: true } },
        pole: { select: { id: true, name: true, members: { select: { userId: true } } } },
        options: {
          orderBy: { order: "asc" },
          include: { votes: { include: { user: { select: { id: true, name: true, avatarColor: true } } } } },
        },
      },
    }),
    getPoleOptions(db),
    myPoleIds(db, user.id),
    db.member.count({ where: { status: "ACTIVE" } }),
  ]);

  const cards: PollCardData[] = polls.map((p) => {
    const closed = !!p.closedAt || (!!p.closesAt && p.closesAt < now);
    const voters = new Set(p.options.flatMap((o) => o.votes.map((v) => v.userId)));
    return {
      id: p.id,
      question: p.question,
      description: p.description,
      multiple: p.multiple,
      anonymous: p.anonymous,
      closesAt: p.closesAt,
      closed,
      closedAt: p.closedAt ?? (closed ? p.closesAt : null),
      createdBy: p.createdBy?.name ?? null,
      pole: p.pole?.name ?? null,
      options: p.options.map((o) => ({
        id: o.id,
        label: o.label,
        votes: o.votes.length,
        voters: p.anonymous ? [] : o.votes.map((v) => v.user),
      })),
      myVotes: p.options.filter((o) => o.votes.some((v) => v.userId === user.id)).map((o) => o.id),
      voters: voters.size,
      eligible: p.pole ? p.pole.members.length : memberCount,
      canVote: !closed && (!p.poleId || poleIds.includes(p.poleId)),
      canEdit: can.editPoll(user, p),
    };
  });
  const open = cards.filter((c) => !c.closed);
  const closed = cards.filter((c) => c.closed);

  const newPoll = (autoOpen: boolean) => (
    <FormDialog
      title={t.polls.new}
      action={createPoll}
      submitLabel={t.common.create}
      defaultOpen={autoOpen && sp.new === "1"}
      trigger={
        <Button>
          <Plus /> {t.polls.new}
        </Button>
      }
    >
      <PollFields poles={poles} />
    </FormDialog>
  );

  return (
    <>
      <PageHeader title={t.polls.title} description={t.polls.subtitle} actions={newPoll(true)} />
      {cards.length === 0 ? (
        <EmptyState icon={<Vote />} title={t.polls.empty} action={newPoll(false)} />
      ) : (
        <div className="space-y-10">
          {open.length > 0 && (
            <section>
              <h2 className="mb-3 text-[15px] font-semibold">{t.polls.open}</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {open.map((p) => (
                  <PollCard key={p.id} poll={p} />
                ))}
              </div>
            </section>
          )}
          {closed.length > 0 && (
            <section>
              <h2 className="mb-3 text-[15px] font-semibold text-muted-foreground">{t.polls.closed}</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {closed.map((p) => (
                  <PollCard key={p.id} poll={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
