"use client";

import { ActionForm, SubmitButton, useFormCtx } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/fields";
import { login } from "@/actions/auth";
import { useT } from "@/lib/i18n/client";

function ErrorBanner() {
  const { state } = useFormCtx();
  if (!state || state.ok || !state.error) return null;
  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {state.error}
    </p>
  );
}

export function LoginForm({ next }: { next: string }) {
  const t = useT();
  return (
    <ActionForm action={login} successToast={false} errorToast={false} className="space-y-4">
      <ErrorBanner />
      <input type="hidden" name="next" value={next} />
      <TextField name="email" type="email" label={t.auth.email} autoComplete="email" required autoFocus />
      <TextField name="password" type="password" label={t.auth.password} autoComplete="current-password" required />
      <SubmitButton size="lg" className="w-full" pendingLabel={t.auth.signingIn}>
        {t.auth.signIn}
      </SubmitButton>
    </ActionForm>
  );
}
