"use client";

import * as React from "react";
import { KeyRound } from "lucide-react";
import { ActionForm, SubmitButton, useFormCtx } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/fields";
import { signup } from "@/actions/auth";
import { useT } from "@/lib/i18n/client";

function ErrorBanner() {
  const { state } = useFormCtx();
  if (!state || state.ok || !state.error || state.fieldErrors) return null;
  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {state.error}
    </p>
  );
}

export function SignupForm({
  defaultCode,
  codeRequired,
  isFirst,
}: {
  defaultCode: string;
  codeRequired: boolean;
  isFirst: boolean;
}) {
  const t = useT();
  const [showCode, setShowCode] = React.useState(!!defaultCode || codeRequired);
  return (
    <ActionForm action={signup} successToast={false} errorToast={false} className="space-y-4">
      <ErrorBanner />
      {isFirst && (
        <p className="rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary-soft-foreground">
          {t.account.signup.firstUser}
        </p>
      )}
      <TextField name="name" label={t.setup.yourName} autoComplete="name" required autoFocus />
      <TextField name="email" type="email" label={t.auth.email} autoComplete="email" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="password"
          type="password"
          label={t.auth.password}
          autoComplete="new-password"
          minLength={10}
          required
          hint={t.validation.passwordLength}
        />
        <TextField
          name="confirm"
          type="password"
          label={t.setup.confirmPassword}
          autoComplete="new-password"
          minLength={10}
          required
        />
      </div>
      {showCode ? (
        <TextField
          name="code"
          label={t.account.signup.code}
          defaultValue={defaultCode}
          placeholder="XXXXX-XXXXX"
          hint={t.account.signup.codeHint}
          required={codeRequired}
          className="[&_input]:font-mono [&_input]:tracking-wider [&_input]:uppercase"
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowCode(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <KeyRound className="size-4" /> {t.account.signup.code}
        </button>
      )}
      <SubmitButton size="lg" className="w-full" pendingLabel={t.account.signup.creating}>
        {t.account.signup.submit}
      </SubmitButton>
    </ActionForm>
  );
}
