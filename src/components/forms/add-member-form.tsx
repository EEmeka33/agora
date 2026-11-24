"use client";

import { Plus } from "lucide-react";
import { ActionForm, SubmitButton, type FormAction } from "./action-form";
import { Input, Select } from "@/components/ui/input";
import { useT } from "@/lib/i18n/client";

/** Inline "add a person" form: member select + optional role. */
export function AddMemberForm({
  action,
  members,
  roleOptions,
  rolePlaceholder,
  submitLabel,
}: {
  action: FormAction;
  members: { id: string; name: string }[];
  /** Select of predefined roles, or a free text input when omitted. */
  roleOptions?: { value: string; label: string }[];
  rolePlaceholder?: string;
  submitLabel: string;
}) {
  const t = useT();
  if (members.length === 0) return null;
  return (
    <ActionForm action={action} resetOnSuccess className="flex flex-col gap-2 sm:flex-row">
      <Select name="userId" required defaultValue="" className="h-9 flex-1">
        <option value="" disabled>
          {t.common.selectPlaceholder}
        </option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </Select>
      {roleOptions ? (
        <Select name="role" className="h-9 sm:w-40">
          {roleOptions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      ) : (
        <Input name="role" placeholder={rolePlaceholder} className="h-9 sm:w-44" />
      )}
      <SubmitButton variant="soft">
        <Plus /> {submitLabel}
      </SubmitButton>
    </ActionForm>
  );
}
