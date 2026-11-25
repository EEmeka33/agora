import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const intlLocale = (locale: string) => (locale === "fr" ? "fr-FR" : "en-GB");

// ─── Money ──────────────────────────────────────────────────────────────────

export function formatMoney(cents: number | null | undefined, currency = "EUR", locale = "en") {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

/** Parses "12,50" / "12.5" / "1 200" into cents. Returns null when empty or invalid. */
export function parseMoneyToCents(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim().replace(/\s| /g, "").replace(",", ".");
  if (raw === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

export function centsToInput(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2).replace(/\.00$/, "");
}

// ─── Dates ──────────────────────────────────────────────────────────────────
// Dates are stored as "wall time" in UTC (what you type is what you see),
// so every formatter uses timeZone: "UTC".

export function formatDate(
  date: Date | string | null | undefined,
  locale = "en",
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
) {
  if (!date) return "";
  return new Intl.DateTimeFormat(intlLocale(locale), { timeZone: "UTC", ...opts }).format(new Date(date));
}

export function formatDateTime(date: Date | string | null | undefined, locale = "en") {
  return formatDate(date, locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(date: Date | string | null | undefined, locale = "en") {
  return formatDate(date, locale, { hour: "2-digit", minute: "2-digit" });
}

/** Relative time for real instants (createdAt, updatedAt…). */
export function formatRelative(date: Date | string, locale = "en", now = new Date()) {
  const diff = new Date(date).getTime() - now.getTime();
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
  const abs = Math.abs(diff);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (abs < minute) return rtf.format(0, "second");
  if (abs < hour) return rtf.format(Math.round(diff / minute), "minute");
  if (abs < day) return rtf.format(Math.round(diff / hour), "hour");
  if (abs < 30 * day) return rtf.format(Math.round(diff / day), "day");
  if (abs < 365 * day) return rtf.format(Math.round(diff / (30 * day)), "month");
  return rtf.format(Math.round(diff / (365 * day)), "year");
}

/** Absolute date+time for real instants (createdAt…), in the server's time zone. */
export function formatInstant(date: Date | string | null | undefined, locale = "en") {
  if (!date) return "";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** Current local wall-clock time expressed in UTC (matches how dates are stored). */
export function nowWall() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
}

export function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** "2026-03-04" → Date (UTC midnight). */
export function parseDateInput(input: unknown): Date | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;
  const d = new Date(raw.length === 10 ? `${raw}T00:00:00Z` : `${raw.slice(0, 16)}:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → "2026-03-04" for <input type="date"> */
export function toDateInput(date: Date | string | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

/** Date → "2026-03-04T18:30" for <input type="datetime-local"> */
export function toDateTimeInput(date: Date | string | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 16);
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((startOfDayUTC(b).getTime() - startOfDayUTC(a).getTime()) / 86_400_000);
}

export function isOverdue(due: Date | string | null | undefined, done = false) {
  if (!due || done) return false;
  return startOfDayUTC(new Date(due)) < startOfDayUTC(nowWall());
}

// ─── Misc ───────────────────────────────────────────────────────────────────

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** "1h30", "1h", "90min", "45m", "1:30", "2.5", "2,5" → minutes (null if invalid or > 24h). */
export function parseDuration(input: unknown): number | null {
  const raw = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(",", ".")
    .replace(/\s+/g, "");
  if (!raw) return null;
  let minutes: number | null = null;
  let m: RegExpMatchArray | null;
  if ((m = raw.match(/^(\d+(?:\.\d+)?)h(?:(\d{1,2})(?:m|min)?)?$/))) minutes = Number(m[1]) * 60 + Number(m[2] ?? 0);
  else if ((m = raw.match(/^(\d+)(?:m|min|mn)$/))) minutes = Number(m[1]);
  else if ((m = raw.match(/^(\d+):(\d{2})$/))) minutes = Number(m[1]) * 60 + Number(m[2]);
  else if ((m = raw.match(/^\d+(?:\.\d+)?$/))) minutes = Number(raw) * 60;
  if (minutes === null || !Number.isFinite(minutes)) return null;
  minutes = Math.round(minutes);
  return minutes > 0 && minutes <= 24 * 60 ? minutes : null;
}

/** 90 → "1.5" (hours, one decimal at most) */
export function minutesToHours(minutes: number, locale = "en") {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", { maximumFractionDigits: 1 }).format(minutes / 60);
}
