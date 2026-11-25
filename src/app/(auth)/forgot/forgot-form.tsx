"use client";

import { MailCheck } from "lucide-react";
import { ActionForm, SubmitButton, useFormCtx } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/fields";
import { requestPasswordReset } from "@/actions/auth";
import { useT } from "@/lib/i18n/client";

function Result() {
  const { state } = useFormCtx();
  if (!state?.message) return null;
  return (
    <p className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm">
      <MailCheck className="mt-0.5 size-4 shrink-0 text-success" /> {state.message}
    </p>
  );
}

export function ForgotForm() {
  const t = useT();
  return (
    <ActionForm action={requestPasswordReset} successToast={false} className="space-y-4">
      <Result />
      <TextField name="email" type="email" label={t.auth.email} autoComplete="email" required autoFocus />
      <SubmitButton size="lg" className="w-full" pendingLabel={t.common.saving}>
        {t.account.forgot.submit}
      </SubmitButton>
    </ActionForm>
  );
}
