"use client";

import { ActionForm, SubmitButton, type FormAction } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/fields";
import { useT } from "@/lib/i18n/client";

export function InviteForm({
  action,
  email,
  name,
  reset,
}: {
  action: FormAction;
  email: string;
  name: string;
  reset: boolean;
}) {
  const t = useT();
  return (
    <ActionForm action={action} successToast={false} className="space-y-4">
      <TextField name="email" label={t.auth.email} defaultValue={email} disabled />
      {!reset && <TextField name="name" label={t.common.name} defaultValue={name} required autoComplete="name" />}
      <TextField
        name="password"
        type="password"
        label={t.auth.password}
        minLength={10}
        required
        autoComplete="new-password"
        hint={t.validation.passwordLength}
      />
      <TextField
        name="confirm"
        type="password"
        label={t.setup.confirmPassword}
        minLength={10}
        required
        autoComplete="new-password"
      />
      <SubmitButton size="lg" className="w-full" pendingLabel={t.common.saving}>
        {reset ? t.auth.invite.resetSubmit : t.auth.invite.submit}
      </SubmitButton>
    </ActionForm>
  );
}
