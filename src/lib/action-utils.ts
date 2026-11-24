import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./auth";
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

export type ActionContext = { user: CurrentUser; t: Dictionary; locale: Locale };

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

/**
 * Wraps a server action: checks the session, provides the dictionary,
 * catches unexpected errors and refreshes the UI after a successful mutation.
 */
export async function withUser(fn: (ctx: ActionContext) => Promise<ActionState>): Promise<ActionState> {
  const { t, locale } = await getI18n();
  const user = await getCurrentUser();
  if (!user) return fail(t.common.notAllowed);
  try {
    const result = await fn({ user, t, locale });
    if (result?.ok) revalidatePath("/", "layout");
    return result;
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ActionError) return fail(error.message);
    console.error(error);
    return fail(t.common.genericError);
  }
}

/** Throws a user-facing permission error when the check is false. */
export function ensure(condition: boolean, t: Dictionary) {
  if (!condition) throw new ActionError(t.common.notAllowed);
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
