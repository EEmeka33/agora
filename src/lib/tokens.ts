import { createHash, randomBytes, randomInt } from "node:crypto";

/** 256-bit random token, URL-safe. */
export function newToken() {
  return randomBytes(32).toString("base64url");
}

/** Tokens are stored hashed: a database leak never exposes usable sessions or links. */
export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

// No 0/O/1/I to avoid confusion when codes are read aloud or typed.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Human-friendly join code, e.g. "K7QXM-2RPZA" (32^10 ≈ 10^15 combinations). */
export function newJoinCode() {
  let raw = "";
  for (let i = 0; i < 10; i++) raw += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

/** Accepts "k7qxm2rpza", "K7QXM 2RPZA"… and returns "K7QXM-2RPZA" (or "" if invalid). */
export function normalizeJoinCode(input: string) {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length !== 10 || [...raw].some((c) => !CODE_ALPHABET.includes(c))) return "";
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}
