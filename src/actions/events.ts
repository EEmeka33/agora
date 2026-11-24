"use server";

import { db } from "@/lib/db";
import { ensure, fail, ok, reader, withUser, type ActionState } from "@/lib/action-utils";
import { EVENT_TYPES, RSVP } from "@/lib/constants";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";

function readEvent(fd: FormData) {
  const f = reader(fd);
  return {
    title: f.str("title"),
    description: f.opt("description"),
    type: f.oneOf("type", EVENT_TYPES, "EVENT"),
    startAt: f.date("startAt"),
    endAt: f.date("endAt"),
    location: f.opt("location"),
    agenda: f.opt("agenda"),
    poleId: f.opt("poleId"),
    projectId: f.opt("projectId"),
  };
}

export async function createEvent(_prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    ensure(can.manageEvents(user), t);
    const data = readEvent(fd);
    const errors: Record<string, string> = {};
    if (!data.title) errors.title = t.validation.required;
    if (!data.startAt) errors.startAt = t.validation.invalidDate;
    if (data.startAt && data.endAt && data.endAt < data.startAt) errors.endAt = t.validation.dateOrder;
    if (Object.keys(errors).length || !data.startAt) return fail(t.validation.required, errors);
    const event = await db.event.create({
      data: {
        ...data,
        startAt: data.startAt,
        createdById: user.id,
        attendees: { create: { userId: user.id, status: "GOING" } },
      },
    });
    await logActivity({
      actorId: user.id,
      action: "created",
      entityType: "event",
      entityId: event.id,
      entityLabel: event.title,
    });
    return ok(t.common.created, { id: event.id });
  });
}

export async function updateEvent(id: string, _prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    ensure(can.manageEvents(user), t);
    const data = readEvent(fd);
    const errors: Record<string, string> = {};
    if (!data.title) errors.title = t.validation.required;
    if (!data.startAt) errors.startAt = t.validation.invalidDate;
    if (data.startAt && data.endAt && data.endAt < data.startAt) errors.endAt = t.validation.dateOrder;
    if (Object.keys(errors).length || !data.startAt) return fail(t.validation.required, errors);
    await db.event.update({ where: { id }, data: { ...data, startAt: data.startAt } });
    await logActivity({
      actorId: user.id,
      action: "updated",
      entityType: "event",
      entityId: id,
      entityLabel: data.title,
    });
    return ok(t.common.saved);
  });
}

export async function deleteEvent(id: string) {
  return withUser(async ({ user, t }) => {
    ensure(can.manageEvents(user), t);
    const event = await db.event.delete({ where: { id } });
    await logActivity({ actorId: user.id, action: "deleted", entityType: "event", entityLabel: event.title });
    return ok(t.common.deleted);
  });
}

export async function rsvp(eventId: string, status: string) {
  return withUser(async ({ user, t }) => {
    const next = RSVP.includes(status as never) ? status : "GOING";
    const event = await db.event.findUnique({ where: { id: eventId }, select: { title: true } });
    if (!event) return fail(t.common.notFound);
    await db.eventAttendee.upsert({
      where: { eventId_userId: { eventId, userId: user.id } },
      create: { eventId, userId: user.id, status: next },
      update: { status: next },
    });
    await logActivity({
      actorId: user.id,
      action: "responded",
      entityType: "event",
      entityId: eventId,
      entityLabel: event.title,
    });
    return ok(t.enums.rsvp[next]);
  });
}

export async function saveMinutes(eventId: string, _prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event) return fail(t.common.notFound);
    ensure(
      can.manageEvents(user) || ["SECRETARY", "DEPUTY_SECRETARY", "PRESIDENT"].includes(user.boardPosition ?? ""),
      t,
    );
    await db.event.update({ where: { id: eventId }, data: { minutes: reader(fd).opt("minutes") } });
    await logActivity({
      actorId: user.id,
      action: "updated",
      entityType: "event",
      entityId: eventId,
      entityLabel: event.title,
    });
    return ok(t.common.saved);
  });
}
