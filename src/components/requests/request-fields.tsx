"use client";

import { FormGrid, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { useT } from "@/lib/i18n/client";
import { PRIORITIES } from "@/lib/constants";

type Opt = { id: string; name: string };

export function RequestFields({
  poles,
  myPoles,
  projects,
  defaults,
}: {
  poles: Opt[];
  myPoles: Opt[];
  projects: Opt[];
  defaults?: { poleId?: string | null; fromPoleId?: string | null; projectId?: string | null };
}) {
  const t = useT();
  return (
    <>
      <SelectField
        name="poleId"
        label={t.requests.toPole}
        placeholder={t.common.selectPlaceholder}
        defaultValue={defaults?.poleId ?? ""}
        options={poles.map((p) => ({ value: p.id, label: p.name }))}
        required
      />
      <TextField
        name="title"
        label={t.common.title}
        placeholder={t.requests.titlePlaceholder}
        required
        autoFocus
        maxLength={200}
      />
      <TextAreaField
        name="description"
        label={t.common.description}
        placeholder={t.requests.descriptionPlaceholder}
        rows={4}
        optional
      />
      <FormGrid>
        <SelectField
          name="priority"
          label={t.common.priority}
          defaultValue="MEDIUM"
          options={PRIORITIES.map((p) => ({ value: p, label: t.enums.priority[p] }))}
        />
        <TextField type="date" name="dueDate" label={t.common.dueDate} optional />
        <SelectField
          name="fromPoleId"
          label={t.requests.fromPole}
          placeholder={t.requests.fromNobody}
          defaultValue={defaults?.fromPoleId ?? ""}
          options={myPoles.map((p) => ({ value: p.id, label: p.name }))}
        />
        <SelectField
          name="projectId"
          label={t.common.project}
          placeholder={t.tasks.noProject}
          defaultValue={defaults?.projectId ?? ""}
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
        />
      </FormGrid>
    </>
  );
}
