import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "./db";
import { newToken, sha256 } from "./tokens";
import { clientIp, userAgent } from "./request-info";
import { SESSION_COOKIE, SESSION_DAYS, sessionCookieOptions } from "./session-cookie";

export { hashPassword, verifyPassword } from "./password";

/** The signed-in account (not tied to an association). */
export type Account = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  locale: string | null;
  sessionId: string;
};

const DAY = 24 * 3600 * 1000;

/** Reads the session cookie and returns the account, or null. Memoized per request. */
export const getAccount = cache(async (): Promise<Account | null> => {
  // Everything behind a session is rendered at request time.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: {
      user: { select: { id: true, name: true, email: true, avatarColor: true, locale: true, passwordHash: true } },
    },
  });
  if (!session || session.expiresAt < new Date() || !session.user.passwordHash) return null;
  // Sliding expiration, written at most once per hour.
  if (Date.now() - session.lastSeenAt.getTime() > 3600_000) {
    await db.session
      .update({
        where: { id: session.id },
        data: { lastSeenAt: new Date(), expiresAt: new Date(Date.now() + SESSION_DAYS * DAY) },
      })
      .catch(() => {});
  }
  const { user } = session;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor,
    locale: user.locale,
    sessionId: session.id,
  };
});

/** Use in pages that only need an account (e.g. /welcome). */
export async function requireAccount() {
  const account = await getAccount();
  if (!account) redirect("/login");
  return account;
}

/** Creates a session in the database and sets the cookie (server actions / route handlers only). */
export async function createSession(userId: string) {
  const token = newToken();
  await db.session.create({
    data: {
      tokenHash: sha256(token),
      userId,
      userAgent: await userAgent(),
      ip: await clientIp(),
      expiresAt: new Date(Date.now() + SESSION_DAYS * DAY),
    },
  });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  store.delete(SESSION_COOKIE);
}

/** Signs the account out everywhere except (optionally) the current browser. */
export async function revokeSessions(userId: string, keepSessionId?: string) {
  await db.session.deleteMany({ where: { userId, ...(keepSessionId ? { id: { not: keepSessionId } } : {}) } });
}
