"use server";

import { assertRefs, ensure, fail, ok, reader, withUser, type ActionState } from "@/lib/action-utils";
import { can } from "@/lib/permissions";
import { nowWall, parseDuration } from "@/lib/utils";

export async function logTime(_prev: ActionState, fd: FormData) {
  return withUser(async (ctx) => {
    const { user, t, db, association } = ctx;
    const f = reader(fd);
    const minutes = parseDuration(f.str("duration"));
    if (!minutes) return fail(t.volunteering.invalidDuration, { duration: t.volunteering.invalidDuration });
    const refs = {
      poleId: f.opt("poleId"),
      projectId: f.opt("projectId"),
      taskId: f.opt("taskId"),
      eventId: f.opt("eventId"),
    };
    await assertRefs(ctx, refs);
    await db.timeEntry.create({
      data: {
        associationId: association.id,
        userId: user.id,
        date: f.date("date") ?? nowWall(),
        minutes,
        description: f.opt("description"),
        ...refs,
      },
    });
    return ok(t.common.saved);
  });
}

export async function deleteTimeEntry(id: string) {
  return withUser(async ({ user, t, db }) => {
    const entry = await db.timeEntry.findUnique({ where: { id } });
    if (!entry) return fail(t.common.notFound);
    ensure(can.deleteTimeEntry(user, entry), t);
    await db.timeEntry.delete({ where: { id } });
    return ok(t.common.deleted);
  });
}
