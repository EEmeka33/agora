#!/usr/bin/env node
/**
 * One-time local setup:
 *   1. creates .env from .env.example with a random AUTH_SECRET
 *   2. creates the data/ folder
 *   3. applies database migrations and generates the Prisma client
 */
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

if (!existsSync(".env")) {
  const example = readFileSync(".env.example", "utf8");
  const secret = randomBytes(32).toString("hex");
  writeFileSync(".env", example.replace("change-me-to-a-long-random-string", secret));
  console.log("✔ Created .env with a random AUTH_SECRET");
} else {
  console.log("• .env already exists — keeping it");
}

mkdirSync("data/uploads", { recursive: true });
run("npx prisma migrate deploy");
run("npx prisma generate");

console.log(`
✔ Agora is ready.

  npm run dev        → start in development mode on http://localhost:3000
  npm run db:seed    → (optional) load a demo association

Open the app and follow the setup wizard to create your association.
`);
