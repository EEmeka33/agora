import { readFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAccount } from "@/lib/auth";
import { safeStoredPath } from "@/lib/uploads";

/** Streams an uploaded document to active members of its association only. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/files/[id]">) {
  const account = await getAccount();
  if (!account) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc?.storedName) return new NextResponse("Not found", { status: 404 });
  const member = await db.member.findUnique({
    where: { associationId_userId: { associationId: doc.associationId, userId: account.id } },
  });
  if (member?.status !== "ACTIVE") return new NextResponse("Not found", { status: 404 });
  try {
    const data = await readFile(safeStoredPath(doc.storedName));
    const inline = request.nextUrl.searchParams.get("download") !== "1";
    const name = encodeURIComponent(doc.fileName ?? doc.storedName);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": doc.mimeType ?? "application/octet-stream",
        "Content-Length": String(data.length),
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${name}`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox",
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch {
    return new NextResponse("File missing on disk", { status: 404 });
  }
}
