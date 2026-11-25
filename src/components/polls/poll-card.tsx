"use client";

import * as React from "react";
import { Lock, Trash2, Users } from "lucide-react";
import { closePoll, deletePoll, votePoll } from "@/actions/polls";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { RowActions, type RowAction } from "@/components/forms/row-actions";
import { AvatarStack } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RichText } from "@/components/ui/rich-text";
import { useLocale, useT } from "@/lib/i18n/client";
import { cn, formatRelative, pct } from "@/lib/utils";

export type PollCardData = {
  id: string;
  question: string;
  description: string | null;
  multiple: boolean;
  anonymous: boolean;
  closesAt: Date | null;
  closed: boolean;
  closedAt: Date | null;
  createdBy: string | null;
  pole: string | null;
  options: { id: string; label: string; votes: number; voters: { id: string; name: string; avatarColor: string }[] }[];
  myVotes: string[];
  voters: number;
  eligible: number;
  canVote: boolean;
  canEdit: boolean;
};

export function PollCard({ poll }: { poll: PollCardData }) {
  const t = useT();
  const locale = useLocale();
  const voted = poll.myVotes.length > 0;
  const [editing, setEditing] = React.useState(!voted);
  const showResults = poll.closed || (voted && !editing) || !poll.canVote;
  const total = poll.options.reduce((s, o) => s + o.votes, 0);
  const max = Math.max(0, ...poll.options.map((o) => o.votes));

  const items: RowAction[] = [];
  if (poll.canEdit && !poll.closed)
    items.push({
      kind: "confirm",
      label: t.polls.close,
      icon: <Lock />,
      title: t.polls.close,
      confirmLabel: t.polls.close,
      action: closePoll.bind(null, poll.id),
      destructive: false,
    });
  if (poll.canEdit)
    items.push({
      kind: "confirm",
      label: t.polls.delete,
      icon: <Trash2 />,
      title: t.polls.delete,
      action: deletePoll.bind(null, poll.id),
      destructive: true,
    });

  return (
    <Card id={`poll-${poll.id}`} className="scroll-mt-20 p-5">
      <div className="mb-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge color={poll.closed ? "slate" : "emerald"} dot>
              {poll.closed ? t.polls.closed : t.polls.open}
            </Badge>
            {poll.pole && <Badge color="sky">{poll.pole}</Badge>}
            {poll.anonymous && <Badge color="violet">🔒</Badge>}
          </div>
          <h3 className="font-semibold tracking-tight text-balance">{poll.question}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground" suppressHydrationWarning>
            {poll.createdBy && t.polls.by(poll.createdBy)}
            {poll.closed && poll.closedAt && ` · ${t.polls.closedOn(formatRelative(poll.closedAt, locale))}`}
            {!poll.closed && poll.closesAt && ` · ${t.polls.closesIn(formatRelative(poll.closesAt, locale))}`}
          </p>
        </div>
        {items.length > 0 && <RowActions items={items} />}
      </div>
      {poll.description && <RichText text={poll.description} className="mb-4 text-muted-foreground" />}

      {showResults ? (
        <ul className="space-y-3">
          {poll.options.map((o) => {
            const share = pct(o.votes, total);
            const leading = poll.closed && o.votes === max && max > 0;
            return (
              <li key={o.id}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span className={cn("flex items-center gap-1.5", leading && "font-semibold")}>
                    {o.label}
                    {poll.myVotes.includes(o.id) && (
                      <Badge color="indigo" className="px-1.5 text-[10px]">
                        {t.polls.youVoted}
                      </Badge>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {o.votes} · {share}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", leading ? "bg-primary" : "bg-primary/50")}
                    style={{ width: `${share}%` }}
                  />
                </div>
                {!poll.anonymous && o.voters.length > 0 && (
                  <div className="mt-1.5">
                    <AvatarStack people={o.voters} max={8} size="xs" />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <ActionForm
          action={votePoll.bind(null, poll.id)}
          successToast
          className="space-y-2"
          onSuccess={() => setEditing(false)}
        >
          {poll.options.map((o) => (
            <label
              key={o.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-hover/60 has-checked:border-primary/50 has-checked:bg-primary-soft/40"
            >
              <input
                type={poll.multiple ? "checkbox" : "radio"}
                name="option"
                value={o.id}
                defaultChecked={poll.myVotes.includes(o.id)}
                required={!poll.multiple}
                className="size-4 accent-[var(--primary)]"
              />
              {o.label}
            </label>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <SubmitButton size="sm">{t.polls.vote}</SubmitButton>
            {voted && (
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                {t.common.cancel}
              </Button>
            )}
          </div>
        </ActionForm>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" /> {t.polls.participation(poll.voters, poll.eligible)}
        </span>
        {showResults && poll.canVote && !poll.closed && (
          <Button size="xs" variant="outline" onClick={() => setEditing(true)}>
            {t.polls.changeVote}
          </Button>
        )}
      </div>
    </Card>
  );
}
