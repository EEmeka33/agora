"use server";

import { unlink } from "node:fs/promises";
import { db } from "@/lib/db";
import { ensure, fail, ok, reader, withUser, type ActionState } from "@/lib/action-utils";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import { can } from "@/lib/permissions";
import { safeStoredPath } from "@/lib/uploads";
import { logActivity } from "@/lib/activity";

export async function updateDocument(id: string, _prev: ActionState, fd: FormData) {
  return withUser(async ({ user, t }) => {
    const doc = await db.document.findUnique({ where: { id } });
    if (!doc) return fail(t.common.notFound);
    ensure(can.editDocument(user, doc), t);
    const f = reader(fd);
    const title = f.str("title");
    if (!title) return fail(t.validation.required, { title: t.validation.required });
    await db.document.update({
      where: { id },
      data: {
        title,
        description: f.opt("description"),
        category: f.oneOf("category", DOCUMENT_CATEGORIES, "OTHER"),
        url: doc.storedName ? null : f.opt("url"),
        poleId: f.opt("poleId"),
        projectId: f.opt("projectId"),
      },
    });
    return ok(t.common.saved);
  });
}

export async function deleteDocument(id: string) {
  return withUser(async ({ user, t }) => {
    const doc = await db.document.findUnique({ where: { id } });
    if (!doc) return fail(t.common.notFound);
    ensure(can.editDocument(user, doc), t);
    await db.document.delete({ where: { id } });
    if (doc.storedName) await unlink(safeStoredPath(doc.storedName)).catch(() => {});
    await logActivity({ actorId: user.id, action: "deleted", entityType: "document", entityLabel: doc.title });
    return ok(t.common.deleted);
  });
}
