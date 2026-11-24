import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import { maxUploadBytes, uploadDir } from "@/lib/uploads";
import { logActivity } from "@/lib/activity";

/** Creates a document from an uploaded file or a link (multipart/form-data). */
export async function POST(request: NextRequest) {
  const { t } = await getI18n();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: t.common.notAllowed }, { status: 401 });

  const fd = await request.formData();
  const str = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v.trim() : "";
  };
  const title = str("title");
  const url = str("url");
  const file = fd.get("file");
  const hasFile = file instanceof File && file.size > 0;

  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = t.validation.required;
  if (!hasFile && !url) fieldErrors.file = t.documents.fileOrLinkRequired;
  if (hasFile && file.size > maxUploadBytes()) fieldErrors.file = t.documents.tooLarge(maxUploadBytes() / 1024 / 1024);
  if (url && !/^https?:\/\//i.test(url)) fieldErrors.url = t.validation.required;
  if (Object.keys(fieldErrors).length) {
    return NextResponse.json({ ok: false, error: t.validation.required, fieldErrors }, { status: 400 });
  }

  let stored: { storedName: string; fileName: string; mimeType: string; sizeBytes: number } | null = null;
  if (hasFile) {
    const ext = path
      .extname(file.name)
      .replace(/[^a-zA-Z0-9.]/g, "")
      .slice(0, 10);
    const storedName = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
    await mkdir(uploadDir(), { recursive: true });
    await writeFile(path.join(uploadDir(), storedName), Buffer.from(await file.arrayBuffer()));
    stored = {
      storedName,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    };
  }

  const category = DOCUMENT_CATEGORIES.includes(str("category") as never) ? str("category") : "OTHER";
  const doc = await db.document.create({
    data: {
      title,
      description: str("description") || null,
      category,
      url: stored ? null : url,
      poleId: str("poleId") || null,
      projectId: str("projectId") || null,
      uploadedById: user.id,
      ...stored,
    },
  });
  await logActivity({
    actorId: user.id,
    action: "uploaded",
    entityType: "document",
    entityId: doc.id,
    entityLabel: doc.title,
  });
  return NextResponse.json({ ok: true, id: doc.id, message: t.common.created });
}
