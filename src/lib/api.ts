import "server-only";
import type { NextRequest } from "next/server";

/** Rejects cross-site POSTs to route handlers (server actions have their own check). */
export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin form posts from older browsers
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Neutralizes spreadsheet formulas and quotes a CSV cell. */
export function csvCell(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function csv(header: unknown[], rows: unknown[][]) {
  return "\ufeff" + [header, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n");
}

export function fileName(base: string) {
  return base
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}
