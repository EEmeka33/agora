"use client";

import { FormGrid, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { useT } from "@/lib/i18n/client";
import { FREQUENCIES } from "@/lib/constants";

type Opt = { id: string; name: string };

export function ResponsibilityFields({
  value,
  members,
  poles,
}: {
  value?: {
    title?: string;
    description?: string | null;
    frequency?: string;
    ownerId?: string | null;
    poleId?: string | null;
  };
  members: Opt[];
  poles: Opt[];
}) {
  const t = useT();
  return (
    <>
      <TextField name="title" label={t.structure.responsibility} defaultValue={value?.title} required autoFocus />
      <TextAreaField
        name="description"
        label={t.common.description}
        defaultValue={value?.description ?? ""}
        rows={2}
        optional
      />
      <FormGrid>
        <SelectField
          name="ownerId"
          label={t.common.owner}
          placeholder={t.common.unassigned}
          defaultValue={value?.ownerId ?? ""}
          options={members.map((m) => ({ value: m.id, label: m.name }))}
        />
        <SelectField
          name="frequency"
          label={t.structure.frequency}
          defaultValue={value?.frequency ?? "ONGOING"}
          options={FREQUENCIES.map((f) => ({ value: f, label: t.enums.frequency[f] }))}
        />
        <SelectField
          name="poleId"
          label={t.common.pole}
          placeholder={t.common.none}
          defaultValue={value?.poleId ?? ""}
          options={poles.map((p) => ({ value: p.id, label: p.name }))}
          className="sm:col-span-2"
        />
      </FormGrid>
    </>
  );
}
