"use client";

import { ActionForm, SubmitButton, type FormAction } from "./action-form";
import { TextAreaField } from "./fields";

/** Small inline form with a textarea and a submit button. */
export function InlineTextForm({
  action,
  name = "body",
  placeholder,
  submitLabel,
  defaultValue,
  rows = 3,
  resetOnSuccess = true,
  successToast = false,
  children,
}: {
  action: FormAction;
  name?: string;
  placeholder?: string;
  submitLabel: string;
  defaultValue?: string;
  rows?: number;
  resetOnSuccess?: boolean;
  successToast?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <ActionForm action={action} resetOnSuccess={resetOnSuccess} successToast={successToast} className="space-y-2">
      <TextAreaField name={name} placeholder={placeholder} rows={rows} defaultValue={defaultValue} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        {children}
        <SubmitButton size="sm">{submitLabel}</SubmitButton>
      </div>
    </ActionForm>
  );
}
