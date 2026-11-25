#!/usr/bin/env node
/**
 * Consistent backup of the database (safe while Agora is running) and of the uploaded files.
 *   npm run db:backup                → ./backups/agora-YYYY-MM-DD-HHMM/
 *   npm run db:backup -- /some/dir   → /some/dir/agora-YYYY-MM-DD-HHMM/
 */
import "dotenv/config";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dbFile = path.resolve((process.env.DATABASE_URL ?? "file:./data/agora.db").replace(/^file:/, ""));
const uploads = path.resolve(process.env.UPLOAD_DIR ?? "./data/uploads");
const stamp = new Date()
  .toISOString()
  .slice(0, 16)
  .replace(/[-:T]/g, "")
  .replace(/^(\d{8})(\d{4})$/, "$1-$2");
const target = path.resolve(process.argv[2] ?? "backups", `agora-${stamp}`);

if (!existsSync(dbFile)) {
  console.error(`Database not found: ${dbFile}`);
  process.exit(1);
}
mkdirSync(target, { recursive: true, mode: 0o700 });
const db = new Database(dbFile, { readonly: true });
await db.backup(path.join(target, "agora.db"));
db.close();
if (existsSync(uploads)) cpSync(uploads, path.join(target, "uploads"), { recursive: true });
console.log(`✔ Backup written to ${target}`);
