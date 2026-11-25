"use client";

import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/fields";
import { joinWithCode } from "@/actions/associations";
import { useT } from "@/lib/i18n/client";

export function JoinCodeForm({ code }: { code?: string }) {
  const t = useT();
  return (
    <ActionForm action={joinWithCode} successToast={false} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <TextField
        name="code"
        defaultValue={code}
        placeholder={t.welcome.codePlaceholder}
        aria-label={t.account.signup.code}
        required
        className="flex-1 [&_input]:font-mono [&_input]:tracking-wider [&_input]:uppercase"
      />
      <SubmitButton variant="soft">{t.welcome.join}</SubmitButton>
    </ActionForm>
  );
}
