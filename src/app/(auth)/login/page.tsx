import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <Suspense>
      <Login searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Login({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  await connection();
  const { t } = await getI18n();
  if ((await db.user.count()) === 0) redirect("/setup");
  if (await getCurrentUser()) redirect("/");
  const association = await db.association.findFirst({ select: { name: true } });
  const { next } = await searchParams;

  return (
    <div>
      <div className="mb-8">
        {association && (
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" /> {association.name}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight">{t.auth.welcomeBack}</h1>
        <p className="mt-2 text-muted-foreground">{t.auth.signInSubtitle}</p>
      </div>
      <LoginForm next={typeof next === "string" ? next : ""} />
      <p className="mt-8 text-sm text-muted-foreground">{t.auth.noAccount}</p>
    </div>
  );
}
