import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { getAccount, type Account } from "./auth";
import { getContext, type Context } from "./context";
import { getI18n } from "./i18n/server";
import type { Dictionary } from "./i18n/dictionaries";
import type { Locale } from "./constants";
import { parseDateInput, parseMoneyToCents } from "./utils";

/** What every server action returns to the form that called it. */
export type ActionState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Extra payload, e.g. an invitation link to display. */
  data?: Record<string, string>;
  /** Changes on every call so the client can react to repeated identical results. */
  ts?: number;
} | null;

export type ActionContext = Context & { t: Dictionary; locale: Locale };

export const ok = (message?: string, data?: Record<string, string>): ActionState => ({
  ok: true,
  message,
  data,
  ts: Date.now(),
});

export const fail = (error: string, fieldErrors?: Record<string, string>): ActionState => ({
  ok: false,
  error,
  fieldErrors,
  ts: Date.now(),
});

export class ActionError extends Error {}

async function run(fn: () => Promise<ActionState>, t: Dictionary): Promise<ActionState> {
  try {
    const result = await fn();
    if (result?.ok) revalidatePath("/", "layout");
    return result;
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ActionError) return fail(error.message);
    console.error(error);
    return fail(t.common.genericError);
  }
}

/**
 * Wraps a server action that works inside the current association: checks the
 * session and the membership, gives a tenant-scoped database client, catches
 * unexpected errors and refreshes the UI after a successful mutation.
 */
export async function withUser(fn: (ctx: ActionContext) => Promise<ActionState>): Promise<ActionState> {
  const { t, locale } = await getI18n();
  const ctx = await getContext();
  if (!ctx) return fail(t.common.notAllowed);
  return run(() => fn({ ...ctx, t, locale }), t);
}

/** Same, for actions about the account itself (no association needed). */
export async function withAccount(
  fn: (ctx: { account: Account; t: Dictionary; locale: Locale }) => Promise<ActionState>,
): Promise<ActionState> {
  const { t, locale } = await getI18n();
  const account = await getAccount();
  if (!account) return fail(t.common.notAllowed);
  return run(() => fn({ account, t, locale }), t);
}

/** Throws a user-facing permission error when the check is false. */
export function ensure(condition: boolean, t: Dictionary) {
  if (!condition) throw new ActionError(t.common.notAllowed);
}

/**
 * Checks that ids coming from a form belong to the current association
 * (prevents linking a task to another association's project, for example).
 */
export async function assertRefs(
  ctx: ActionContext,
  refs: {
    poleId?: string | null;
    projectId?: string | null;
    taskId?: string | null;
    eventId?: string | null;
    userIds?: (string | null | undefined)[];
  },
) {
  const { db, t } = ctx;
  const checks: Promise<boolean>[] = [];
  if (refs.poleId) checks.push(db.pole.count({ where: { id: refs.poleId } }).then((n) => n === 1));
  if (refs.projectId) checks.push(db.project.count({ where: { id: refs.projectId } }).then((n) => n === 1));
  if (refs.taskId) checks.push(db.task.count({ where: { id: refs.taskId } }).then((n) => n === 1));
  if (refs.eventId) checks.push(db.event.count({ where: { id: refs.eventId } }).then((n) => n === 1));
  const ids = [...new Set((refs.userIds ?? []).filter((x): x is string => !!x))];
  if (ids.length) checks.push(db.member.count({ where: { userId: { in: ids } } }).then((n) => n === ids.length));
  const results = await Promise.all(checks);
  if (results.some((r) => !r)) throw new ActionError(t.common.notAllowed);
}

/** Small, typed helpers to read values out of FormData. */
export function reader(fd: FormData) {
  const str = (key: string) => {
    const v = fd.get(key);
    return typeof v === "string" ? v.trim() : "";
  };
  const opt = (key: string) => str(key) || null;
  return {
    str,
    opt,
    has: (key: string) => fd.has(key),
    bool: (key: string) => {
      const v = fd.get(key);
      return v === "on" || v === "true" || v === "1";
    },
    oneOf: <T extends string>(key: string, values: readonly T[], fallback: T): T => {
      const v = str(key) as T;
      return values.includes(v) ? v : fallback;
    },
    optOneOf: <T extends string>(key: string, values: readonly T[]): T | null => {
      const v = str(key) as T;
      return values.includes(v) ? v : null;
    },
    int: (key: string, fallback = 0) => {
      const n = Number.parseInt(str(key), 10);
      return Number.isFinite(n) ? n : fallback;
    },
    date: (key: string) => parseDateInput(str(key)),
    money: (key: string) => parseMoneyToCents(str(key)),
    all: (key: string) => fd.getAll(key).filter((v): v is string => typeof v === "string" && v !== ""),
  };
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
