"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getAccount } from "@/lib/auth";
import { ASSOCIATION_COOKIE } from "@/lib/session-cookie";

/** Marks a notification as read, switches to its association and opens its link. */
export async function openNotification(id: string) {
  const account = await getAccount();
  if (!account) redirect("/login");
  const n = await db.notification.findFirst({ where: { id, userId: account.id } });
  if (!n) redirect("/notifications");
  if (!n.readAt) await db.notification.update({ where: { id }, data: { readAt: new Date() } });
  if (n.associationId) {
    const member = await db.member.findUnique({
      where: { associationId_userId: { associationId: n.associationId, userId: account.id } },
    });
    if (member?.status === "ACTIVE") {
      (await cookies()).set(ASSOCIATION_COOKIE, n.associationId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
  }
  const link = n.link?.startsWith("/") && !n.link.startsWith("//") ? n.link : "/notifications";
  redirect(link);
}

export async function markAllNotificationsRead() {
  const account = await getAccount();
  if (!account) return;
  await db.notification.updateMany({ where: { userId: account.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
}
