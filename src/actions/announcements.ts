"use server";

import { ensure, fail, ok, reader, withUser, type ActionState } from "@/lib/action-utils";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { associationMemberIds, notify } from "@/lib/notifications";

export async function createAnnouncement(_prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, db, association } = ctx;
    ensure(can.manageAnnouncements(user), t);
    const f = reader(fd);
    const title = f.str("title");
    const body = f.str("body");
    const errors: Record<string, string> = {};
    if (!title) errors.title = t.validation.required;
    if (!body) errors.body = t.validation.required;
    if (Object.keys(errors).length) return fail(t.validation.required, errors);
    const a = await db.announcement.create({
      data: { associationId: association.id, title, body, pinned: f.bool("pinned"), authorId: user.id },
    });
    await logActivity(ctx, {
      actorId: user.id,
      action: "posted",
      entityType: "announcement",
      entityId: a.id,
      entityLabel: title,
    });
    await notify(ctx, {
      userIds: await associationMemberIds(association.id),
      type: "announcement.new",
      data: { title },
      link: "/",
    });
    return ok(t.common.created);
  });
}

export async function toggleAnnouncementPin(id: string) {
  return withUser(async ({ user, t, db }) => {
    ensure(can.manageAnnouncements(user), t);
    const a = await db.announcement.findUnique({ where: { id } });
    if (!a) return fail(t.common.notFound);
    await db.announcement.update({ where: { id }, data: { pinned: !a.pinned } });
    return ok();
  });
}

export async function deleteAnnouncement(id: string) {
  return withUser(async ({ user, t, db }) => {
    ensure(can.manageAnnouncements(user), t);
    await db.announcement.delete({ where: { id } });
    return ok(t.common.deleted);
  });
}
