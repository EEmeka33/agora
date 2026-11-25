import "server-only";
import { headers } from "next/headers";

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function userAgent() {
  return ((await headers()).get("user-agent") ?? "").slice(0, 300);
}

/** Absolute base URL of the app, for links in emails and invitations. */
export async function baseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.|\d+\.\d+\.\d+\.\d+)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}
