import "server-only";
import path from "node:path";

/** Absolute folder where uploaded documents are stored. */
export function uploadDir() {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.UPLOAD_DIR ?? "./data/uploads");
}

/** Absolute path of the SQLite database file. */
export function databaseFile() {
  const url = process.env.DATABASE_URL ?? "file:./data/agora.db";
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), url.replace(/^file:/, ""));
}

export function maxUploadBytes() {
  const mb = Number(process.env.MAX_UPLOAD_MB ?? 20);
  return (Number.isFinite(mb) && mb > 0 ? mb : 20) * 1024 * 1024;
}

/** Only keep safe characters of a stored file name. */
export function safeStoredPath(storedName: string) {
  const name = path.basename(storedName).replace(/[^a-zA-Z0-9._-]/g, "");
  return path.join(uploadDir(), name);
}
