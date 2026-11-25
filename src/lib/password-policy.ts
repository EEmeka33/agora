// Password rules (NIST SP 800-63B style: length over complexity, block common passwords).

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 200;

const COMMON = new Set([
  "password",
  "password1",
  "password12",
  "password123",
  "passw0rd",
  "motdepasse",
  "motdepasse1",
  "1234567890",
  "0123456789",
  "123456789a",
  "azertyuiop",
  "qwertyuiop",
  "qwerty1234",
  "azerty1234",
  "iloveyou12",
  "letmein123",
  "welcome123",
  "bienvenue1",
  "administrateur",
  "administrator",
  "abcdefghij",
  "aaaaaaaaaa",
  "1111111111",
  "football12",
  "soleil1234",
  "doudou1234",
  "loveyou123",
  "changeme12",
  "association",
  "association1",
  "agora12345",
  "agora123456",
]);

export type PasswordIssue = "length" | "tooLong" | "common" | "personal";

/** Returns what is wrong with a password, or null if it is acceptable. */
export function passwordIssue(
  password: string,
  personal: { email?: string; name?: string } = {},
): PasswordIssue | null {
  if (password.length < MIN_PASSWORD_LENGTH) return "length";
  if (password.length > MAX_PASSWORD_LENGTH) return "tooLong";
  const lower = password.toLowerCase();
  if (COMMON.has(lower) || /^(.)\1+$/.test(lower)) return "common";
  const local = personal.email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && lower.includes(local)) return "personal";
  const names = (personal.name ?? "")
    .toLowerCase()
    .split(/\s+/)
    .filter((n) => n.length >= 4);
  if (names.some((n) => lower === n || lower === `${n}123` || lower === `${n}1234`)) return "personal";
  return null;
}
