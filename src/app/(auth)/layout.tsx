import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <AuthShell>{children}</AuthShell>
    </Suspense>
  );
}

async function AuthShell({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getI18n();
  return (
    <I18nProvider locale={locale}>
      <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col dark:bg-primary-soft dark:text-foreground">
          <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:22px_22px] opacity-[0.12]" />
          <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-20 size-[28rem] rounded-full bg-black/10 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold ring-1 ring-white/25 backdrop-blur">
              A
            </span>
            <span className="text-lg font-semibold tracking-tight">{t.meta.appName}</span>
          </div>
          <div className="relative mt-auto max-w-lg">
            <h2 className="text-4xl leading-tight font-semibold tracking-tight text-balance">{t.auth.brandTitle}</h2>
            <ul className="mt-8 space-y-3.5">
              {t.auth.brandPoints.map((point) => (
                <li key={point} className="flex items-center gap-3 text-[15px] opacity-90">
                  <CheckCircle2 className="size-5 shrink-0 opacity-80" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative mt-12 text-sm opacity-70">{t.meta.tagline}</p>
        </aside>
        <main className="flex items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-md animate-pop-in">{children}</div>
        </main>
      </div>
    </I18nProvider>
  );
}
