import "server-only";
import { after } from "next/server";
import { db } from "./db";
import { dictionaries, isLocale } from "./i18n/dictionaries";
import { emailLayout, mailEnabled, sendMail } from "./mail";
import { baseUrl } from "./request-info";

export type NotificationType =
  | "request.new"
  | "request.taken"
  | "request.assigned"
  | "request.done"
  | "task.assigned"
  | "task.comment"
  | "event.new"
  | "poll.new"
  | "announcement.new"
  | "member.joined";

type NotifyContext = {
  user: { id: string; name: string };
  association: { id: string; name: string; locale: string };
};

/**
 * Sends an in-app notification to some members (never to the person who acted),
 * and an email when SMTP is configured and the person accepts emails.
 */
export async function notify(
  ctx: NotifyContext,
  input: {
    userIds: (string | null | undefined)[];
    type: NotificationType;
    data?: Record<string, string>;
    link?: string;
  },
) {
  const recipients = [...new Set(input.userIds.filter((id): id is string => !!id && id !== ctx.user.id))];
  if (recipients.length === 0) return;
  const data = { actor: ctx.user.name, association: ctx.association.name, ...input.data };
  await db.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      associationId: ctx.association.id,
      type: input.type,
      data: JSON.stringify(data),
      link: input.link ?? null,
      actorId: ctx.user.id,
    })),
  });

  if (!mailEnabled()) return;
  const origin = await baseUrl();
  after(async () => {
    const users = await db.user.findMany({
      where: { id: { in: recipients }, emailNotifications: true, passwordHash: { not: null } },
      select: { email: true, locale: true },
    });
    for (const u of users) {
      const locale = isLocale(u.locale) ? u.locale : isLocale(ctx.association.locale) ? ctx.association.locale : "en";
      const t = dictionaries[locale];
      const message = renderNotification(input.type, data, locale);
      const url = input.link ? `${origin}${input.link}` : origin;
      await sendMail({
        to: u.email,
        subject: `[${ctx.association.name}] ${message}`,
        text: `${message}\n\n${url}\n\n— ${t.notifications.emailFooter}`,
        html: emailLayout({
          heading: ctx.association.name,
          body: message,
          cta: t.notifications.open,
          url,
          footer: t.notifications.emailFooter,
        }),
      });
    }
  });
}

export function renderNotification(type: string, data: Record<string, string>, locale: string) {
  const t = dictionaries[isLocale(locale) ? locale : "en"];
  const render = t.notifications.types[type];
  return render ? render(data) : type;
}

/** Ids of the active members of a pole. */
export async function poleMemberIds(poleId: string) {
  const pole = await db.pole.findUnique({
    where: { id: poleId },
    select: { associationId: true, members: { select: { userId: true } } },
  });
  if (!pole) return [];
  const active = await db.member.findMany({
    where: { associationId: pole.associationId, status: "ACTIVE", userId: { in: pole.members.map((m) => m.userId) } },
    select: { userId: true },
  });
  return active.map((m) => m.userId);
}

/** Ids of all active members of an association (optionally only admins/managers). */
export async function associationMemberIds(associationId: string, roles?: string[]) {
  const rows = await db.member.findMany({
    where: { associationId, status: "ACTIVE", ...(roles ? { role: { in: roles } } : {}) },
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
}
