import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Neutralize spreadsheet formulas and quote everything.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** CSV export of transactions, optionally for one year (?year=2026). */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { t } = await getI18n();
  const year = Number(request.nextUrl.searchParams.get("year"));
  const where =
    Number.isInteger(year) && year > 1900
      ? { date: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } }
      : {};
  const rows = await db.transaction.findMany({
    where,
    orderBy: { date: "asc" },
    include: { project: { select: { title: true } }, pole: { select: { name: true } } },
  });
  const header = [
    t.common.date,
    t.finance.label,
    t.common.type,
    t.common.category,
    t.common.amount,
    t.finance.paymentMethod,
    t.finance.reference,
    t.common.project,
    t.common.pole,
    t.common.notes,
  ];
  const lines = rows.map((r) =>
    [
      r.date.toISOString().slice(0, 10),
      r.label,
      t.enums.transactionType[r.type] ?? r.type,
      t.enums.category[r.category] ?? r.category,
      (((r.type === "EXPENSE" ? -1 : 1) * r.amountCents) / 100).toFixed(2),
      r.paymentMethod ? t.enums.paymentMethod[r.paymentMethod] : "",
      r.reference,
      r.project?.title,
      r.pole?.name,
      r.notes,
    ]
      .map(csvCell)
      .join(";"),
  );
  const csv = "﻿" + [header.map(csvCell).join(";"), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transactions${year ? `-${year}` : ""}.csv"`,
    },
  });
}
