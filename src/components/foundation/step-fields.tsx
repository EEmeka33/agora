"use client";

import { FormGrid, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { useT } from "@/lib/i18n/client";
import { STEP_CATEGORIES, STEP_STATUSES } from "@/lib/constants";
import { toDateInput } from "@/lib/utils";

export type StepValues = {
  title?: string;
  description?: string | null;
  category?: string;
  status?: string;
  assigneeId?: string | null;
  dueDate?: Date | null;
  resourceUrl?: string | null;
  notes?: string | null;
};

export function StepFields({ step, members }: { step?: StepValues; members: { id: string; name: string }[] }) {
  const t = useT();
  return (
    <>
      <TextField name="title" label={t.common.title} defaultValue={step?.title} required autoFocus />
      <TextAreaField
        name="description"
        label={t.common.description}
        defaultValue={step?.description ?? ""}
        rows={3}
        optional
      />
      <FormGrid>
        <SelectField
          name="category"
          label={t.common.category}
          defaultValue={step?.category ?? "PROJECT"}
          options={STEP_CATEGORIES.map((c) => ({ value: c, label: t.enums.stepCategory[c] }))}
        />
        <SelectField
          name="status"
          label={t.common.status}
          defaultValue={step?.status ?? "TODO"}
          options={STEP_STATUSES.map((s) => ({ value: s, label: t.enums.stepStatus[s] }))}
        />
        <SelectField
          name="assigneeId"
          label={t.common.assignee}
          placeholder={t.common.unassigned}
          defaultValue={step?.assigneeId ?? ""}
          options={members.map((m) => ({ value: m.id, label: m.name }))}
        />
        <TextField
          name="dueDate"
          type="date"
          label={t.common.dueDate}
          defaultValue={toDateInput(step?.dueDate)}
          optional
        />
      </FormGrid>
      <TextField
        name="resourceUrl"
        type="url"
        label={t.foundation.resourceUrl}
        placeholder="https://…"
        defaultValue={step?.resourceUrl ?? ""}
        optional
      />
      <TextAreaField name="notes" label={t.common.notes} defaultValue={step?.notes ?? ""} rows={2} optional />
    </>
  );
}
