"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ActionForm, SubmitButton, useFormCtx } from "@/components/forms/action-form";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { setupWorkspace } from "@/actions/setup";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { BOARD_POSITIONS, CURRENCIES, type Locale } from "@/lib/constants";
import { cn } from "@/lib/utils";

const POLE_KEYS = ["communication", "events", "partnerships", "treasury", "members", "projects"] as const;

export function SetupWizard({ defaultLocale }: { defaultLocale: Locale }) {
  const [locale, setLocale] = React.useState<Locale>(defaultLocale);
  const [step, setStep] = React.useState(0);
  const t = dictionaries[locale];
  const steps = [t.setup.stepAssociation, t.setup.stepAccount, t.setup.stepStarter];
  const section0 = React.useRef<HTMLDivElement>(null);
  const section1 = React.useRef<HTMLDivElement>(null);
  const section2 = React.useRef<HTMLDivElement>(null);

  const goNext = () => {
    const current = [section0, section1, section2][step];
    const fields = current.current?.querySelectorAll<HTMLInputElement>("input, select, textarea");
    for (const field of fields ?? []) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return;
      }
    }
    if (step === 1) {
      const form = section1.current?.closest("form");
      const pw = form?.querySelector<HTMLInputElement>('input[name="password"]');
      const confirm = form?.querySelector<HTMLInputElement>('input[name="confirm"]');
      if (pw && confirm && pw.value !== confirm.value) {
        confirm.setCustomValidity(t.setup.passwordMismatch);
        confirm.reportValidity();
        confirm.addEventListener("input", () => confirm.setCustomValidity(""), { once: true });
        return;
      }
    }
    setStep((s) => Math.min(2, s + 1));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
          A
        </span>
        <div className="inline-flex rounded-lg border bg-muted/60 p-0.5 text-[13px]">
          {(["en", "fr"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium",
                locale === l ? "bg-card shadow-sm" : "text-muted-foreground",
              )}
            >
              {t.enums.locale[l]}
            </button>
          ))}
        </div>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.setup.title}</h1>
      <p className="mt-2 text-muted-foreground">{t.setup.subtitle}</p>

      <ol className="mt-7 mb-6 flex items-center gap-2">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-primary-soft text-primary-soft-foreground ring-2 ring-primary/40"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={cn("hidden truncate text-sm font-medium sm:block", i === step ? "" : "text-muted-foreground")}
            >
              {label}
            </span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      <ActionForm action={setupWorkspace} successToast={false}>
        <input type="hidden" name="locale" value={locale} />
        <Errors />
        <div ref={section0} className={cn("space-y-4", step !== 0 && "hidden")}>
          <TextField
            name="name"
            label={t.setup.associationName}
            placeholder={t.setup.associationNamePlaceholder}
            required
            autoFocus
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="shortName" label={t.setup.shortName} optional />
            <TextField name="legalForm" label={t.setup.legalForm} defaultValue="Loi 1901" />
          </div>
          <TextAreaField
            name="purpose"
            label={t.setup.purpose}
            placeholder={t.setup.purposePlaceholder}
            rows={3}
            optional
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField name="city" label={t.setup.city} optional />
            <TextField name="country" label={t.setup.country} defaultValue={locale === "fr" ? "France" : ""} optional />
            <SelectField
              name="currency"
              label={t.setup.currency}
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
              defaultValue="EUR"
            />
          </div>
        </div>

        <div ref={section1} className={cn("space-y-4", step !== 1 && "hidden")}>
          <p className="rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary-soft-foreground">
            {t.setup.accountHint}
          </p>
          <TextField name="adminName" label={t.setup.yourName} autoComplete="name" required />
          <TextField name="email" type="email" label={t.setup.yourEmail} autoComplete="email" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="password"
              type="password"
              label={t.setup.password}
              autoComplete="new-password"
              minLength={8}
              required
              hint={t.validation.passwordLength}
            />
            <TextField
              name="confirm"
              type="password"
              label={t.setup.confirmPassword}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <SelectField
            name="boardPosition"
            label={t.setup.yourPosition}
            defaultValue="PRESIDENT"
            placeholder={t.members.noBoardPosition}
            options={BOARD_POSITIONS.map((p) => ({ value: p, label: t.enums.boardPosition[p] }))}
          />
        </div>

        <div ref={section2} className={cn("space-y-4", step !== 2 && "hidden")}>
          <CheckboxField
            name="checklist"
            defaultChecked
            label={t.setup.starterChecklist}
            hint={t.setup.starterChecklistHint}
          />
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">{t.setup.starterPoles}</p>
            <p className="mb-3 text-xs text-muted-foreground">{t.setup.starterPolesHint}</p>
            <div className="flex flex-wrap gap-2">
              {POLE_KEYS.map((key, i) => (
                <label key={key} className="cursor-pointer">
                  <input type="checkbox" name="poles" value={key} defaultChecked={i < 4} className="peer sr-only" />
                  <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors peer-checked:border-primary/50 peer-checked:bg-primary-soft peer-checked:text-primary-soft-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                    {t.setup.suggestedPoles[key]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft /> {t.setup.back}
            </Button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <Button onClick={goNext}>
              {t.setup.continue} <ArrowRight />
            </Button>
          ) : (
            <SubmitButton size="lg" pendingLabel={t.setup.creating}>
              {t.setup.create}
            </SubmitButton>
          )}
        </div>
      </ActionForm>
    </div>
  );
}

function Errors() {
  const { state } = useFormCtx();
  if (!state || state.ok) return null;
  const messages = state.fieldErrors ? Object.values(state.fieldErrors) : state.error ? [state.error] : [];
  if (!messages.length) return null;
  return (
    <ul className="mb-4 space-y-1 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {messages.map((m) => (
        <li key={m}>{m}</li>
      ))}
    </ul>
  );
}
