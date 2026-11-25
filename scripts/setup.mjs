#!/usr/bin/env node
/**
 * One-time local setup:
 *   1. creates .env from .env.example
 *   2. creates the data/ folder (private to your user)
 *   3. applies database migrations and generates the Prisma client
 */
import { execSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

if (!existsSync(".env")) {
  writeFileSync(".env", readFileSync(".env.example", "utf8"));
  console.log("✔ Created .env");
} else {
  console.log("• .env already exists — keeping it");
}

mkdirSync("data/uploads", { recursive: true });
run("npx prisma migrate deploy");
run("npx prisma generate");

// The database holds personal data: keep it readable by you only (Linux/macOS).
try {
  chmodSync("data", 0o700);
  if (existsSync("data/agora.db")) chmodSync("data/agora.db", 0o600);
} catch {
  /* not supported on this system */
}

console.log(`
✔ Agora is ready.

  npm run dev        → start in development mode on http://localhost:3000
  npm run db:seed    → (optional) load demo associations

Open the app, create your account, then create your association.
`);
