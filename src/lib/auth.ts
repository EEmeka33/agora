import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from "./session";
import type { Role } from "./constants";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  boardPosition: string | null;
  title: string | null;
  avatarColor: string;
  locale: string | null;
};

/** The signed-in user, or null. Memoized for the duration of a request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Everything behind a session is rendered at request time (uses the clock, the database…).
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      boardPosition: true,
      title: true,
      avatarColor: true,
      locale: true,
      status: true,
      passwordHash: true,
    },
  });
  if (!user || user.status !== "ACTIVE" || !user.passwordHash) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    boardPosition: user.boardPosition,
    title: user.title,
    avatarColor: user.avatarColor,
    locale: user.locale,
  };
});

/** Use in pages: redirects to /login when not signed in (or to /setup on a fresh install). */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const count = await db.user.count();
    redirect(count === 0 ? "/setup" : "/login");
  }
  return user;
}

export async function createSession(userId: string) {
  const token = await signSession({ userId });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
