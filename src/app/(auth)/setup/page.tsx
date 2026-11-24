import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { SetupWizard } from "./setup-wizard";

export const metadata: Metadata = { title: "Setup" };

export default function SetupPage() {
  return (
    <Suspense>
      <Setup />
    </Suspense>
  );
}

async function Setup() {
  await connection();
  const { locale } = await getI18n();
  if ((await db.user.count()) > 0) redirect("/login");
  return <SetupWizard defaultLocale={locale} />;
}
