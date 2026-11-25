/** Cookie names and options (no server-only imports: also used by proxy.ts). */
export const SESSION_COOKIE = "agora_session";
export const ASSOCIATION_COOKIE = "agora_asso";
export const SESSION_DAYS = 30;

export function sessionCookieOptions(maxAgeSeconds = SESSION_DAYS * 24 * 3600) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.SECURE_COOKIES === "true",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Session tokens are 43 base64url characters. */
export function looksLikeSessionToken(value: string | undefined) {
  return !!value && /^[A-Za-z0-9_-]{40,60}$/.test(value);
}
