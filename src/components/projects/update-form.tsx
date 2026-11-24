"use client";

import { ActionForm, SubmitButton, type FormAction } from "@/components/forms/action-form";
import { TextAreaField } from "@/components/forms/fields";
import { Select } from "@/components/ui/input";
import { useT } from "@/lib/i18n/client";
import { HEALTH } from "@/lib/constants";

export function ProjectUpdateForm({ action, progress }: { action: FormAction; progress: number }) {
  const t = useT();
  return (
    <ActionForm action={action} resetOnSuccess className="space-y-3">
      <TextAreaField name="body" placeholder={t.projects.updatePlaceholder} rows={3} required />
      <div className="flex flex-wrap items-center gap-2">
        <Select name="health" defaultValue="ON_TRACK" className="h-8 w-auto text-[13px]" aria-label={t.projects.health}>
          {HEALTH.map((h) => (
            <option key={h} value={h}>
              {t.enums.health[h]}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
          {t.common.progress}
          <input
            name="progress"
            type="number"
            min={0}
            max={100}
            defaultValue={progress}
            className="h-8 w-20 rounded-lg border border-input bg-card px-2 text-foreground"
          />
          %
        </label>
        <SubmitButton size="sm" className="ml-auto">
          {t.projects.postUpdate}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
