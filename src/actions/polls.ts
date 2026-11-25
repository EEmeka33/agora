"use server";

import { assertRefs, ensure, fail, ok, reader, withUser, type ActionState } from "@/lib/action-utils";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { associationMemberIds, notify, poleMemberIds } from "@/lib/notifications";

export async function createPoll(_prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, db, association } = ctx;
    const f = reader(fd);
    const question = f.str("question");
    const options = [
      ...new Set(
        f
          .all("option")
          .map((o) => o.trim())
          .filter(Boolean),
      ),
    ].slice(0, 12);
    const errors: Record<string, string> = {};
    if (!question) errors.question = t.validation.required;
    if (options.length < 2) errors.option = t.polls.needTwo;
    if (Object.keys(errors).length) return fail(Object.values(errors)[0], errors);
    const poleId = f.opt("poleId");
    await assertRefs(ctx, { poleId });
    const poll = await db.poll.create({
      data: {
        associationId: association.id,
        question,
        description: f.opt("description"),
        multiple: f.bool("multiple"),
        anonymous: f.bool("anonymous"),
        closesAt: f.date("closesAt"),
        poleId,
        createdById: user.id,
        options: { create: options.map((label, order) => ({ label, order })) },
      },
    });
    await logActivity(ctx, {
      actorId: user.id,
      action: "created",
      entityType: "poll",
      entityId: poll.id,
      entityLabel: question,
    });
    await notify(ctx, {
      userIds: poleId ? await poleMemberIds(poleId) : await associationMemberIds(association.id),
      type: "poll.new",
      data: { title: question },
      link: `/polls#poll-${poll.id}`,
    });
    return ok(t.common.created);
  });
}

export async function votePoll(pollId: string, _prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, db } = ctx;
    const poll = await db.poll.findUnique({ where: { id: pollId }, include: { options: { select: { id: true } } } });
    if (!poll) return fail(t.common.notFound);
    if (poll.closedAt || (poll.closesAt && poll.closesAt < new Date())) return fail(t.polls.closed);
    if (poll.poleId && !(await db.poleMember.count({ where: { poleId: poll.poleId, userId: user.id } }))) {
      return fail(t.polls.notEligible);
    }
    const valid = new Set(poll.options.map((o) => o.id));
    let chosen = [...new Set(reader(fd).all("option"))].filter((id) => valid.has(id));
    if (!poll.multiple) chosen = chosen.slice(0, 1);
    if (chosen.length === 0) return fail(t.polls.chooseOne);
    await db.pollVote.deleteMany({ where: { pollId, userId: user.id } });
    await db.pollVote.createMany({ data: chosen.map((optionId) => ({ pollId, optionId, userId: user.id })) });
    await logActivity(ctx, {
      actorId: user.id,
      action: "voted",
      entityType: "poll",
      entityId: pollId,
      entityLabel: poll.question,
    });
    return ok(t.polls.voted);
  });
}

export async function closePoll(id: string) {
  return withUser(async ({ user, t, db }) => {
    const poll = await db.poll.findUnique({ where: { id } });
    if (!poll) return fail(t.common.notFound);
    ensure(can.editPoll(user, poll), t);
    await db.poll.update({ where: { id }, data: { closedAt: new Date() } });
    return ok(t.common.saved);
  });
}

export async function deletePoll(id: string) {
  return withUser(async ({ user, t, db }) => {
    const poll = await db.poll.findUnique({ where: { id } });
    if (!poll) return fail(t.common.notFound);
    ensure(can.editPoll(user, poll), t);
    await db.poll.delete({ where: { id } });
    return ok(t.common.deleted);
  });
}
