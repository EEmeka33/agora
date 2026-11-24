import { connection, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Used by Docker's healthcheck. */
export async function GET() {
  await connection();
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
