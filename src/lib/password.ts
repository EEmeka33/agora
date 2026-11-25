import "server-only";
import { hash, verify } from "@node-rs/argon2";

// Argon2id with the parameters recommended by OWASP (19 MiB memory, 2 iterations).
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string) {
  return hash(password, OPTIONS);
}

export async function verifyPassword(password: string, passwordHash: string | null | undefined) {
  if (!passwordHash) return false;
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | null = null;

/** Spends the same time as a real check, so response times don't reveal which emails exist. */
export async function fakePasswordCheck(password: string) {
  dummyHash ??= hash("agora-timing-protection", OPTIONS);
  await verify(await dummyHash, password).catch(() => false);
  return false;
}
