"use client";

import * as React from "react";
import { ActionForm, SubmitButton, type FormAction } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/fields";
import { MemberFields, type MemberValues } from "@/components/members/member-fields";
import { changePassword, setLocale } from "@/actions/auth";
import { useLocale, useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function ProfileForm({ action, member }: { action: FormAction; member: MemberValues }) {
  const t = useT();
  return (
    <ActionForm action={action} className="space-y-4">
      <MemberFields member={member} />
      <div className="flex justify-end">
        <SubmitButton pendingLabel={t.common.saving}>{t.common.saveChanges}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function PasswordForm() {
  const t = useT();
  return (
    <ActionForm action={changePassword} resetOnSuccess className="max-w-md space-y-4">
      <TextField
        name="current"
        type="password"
        label={t.settings.currentPassword}
        autoComplete="current-password"
        required
      />
      <TextField
        name="password"
        type="password"
        label={t.settings.newPassword}
        autoComplete="new-password"
        minLength={8}
        required
        hint={t.validation.passwordLength}
      />
      <TextField
        name="confirm"
        type="password"
        label={t.settings.confirmPassword}
        autoComplete="new-password"
        minLength={8}
        required
      />
      <SubmitButton pendingLabel={t.common.saving}>{t.common.save}</SubmitButton>
    </ActionForm>
  );
}

export function LanguagePicker() {
  const t = useT();
  const locale = useLocale();
  const [pending, startTransition] = React.useTransition();
  return (
    <div className="grid grid-cols-2 gap-2 sm:max-w-md">
      {(["en", "fr"] as const).map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => setLocale(l))}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors",
            locale === l ? "border-primary bg-primary-soft text-primary-soft-foreground" : "hover:bg-hover",
          )}
        >
          <span className="text-lg">{l === "en" ? "🇬🇧" : "🇫🇷"}</span>
          {t.enums.locale[l]}
        </button>
      ))}
    </div>
  );
}
