"use client";

import * as React from "react";
import { ColorField, FormGrid, RangeField, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { useT } from "@/lib/i18n/client";
import { COLORS, PRIORITIES, PROJECT_STATUSES } from "@/lib/constants";
import { centsToInput, toDateInput } from "@/lib/utils";

type Opt = { id: string; name: string };

export type ProjectFieldValues = {
  title?: string;
  description?: string | null;
  objectives?: string | null;
  status?: string;
  priority?: string;
  progressMode?: string;
  manualProgress?: number;
  startDate?: Date | null;
  dueDate?: Date | null;
  budgetCents?: number | null;
  color?: string;
  poleId?: string | null;
  leadId?: string | null;
};

export function ProjectFields({
  project,
  members,
  poles,
  currency,
}: {
  project?: ProjectFieldValues;
  members: Opt[];
  poles: Opt[];
  currency: string;
}) {
  const t = useT();
  const [mode, setMode] = React.useState(project?.progressMode ?? "AUTO");
  return (
    <>
      <TextField name="title" label={t.common.title} defaultValue={project?.title} required autoFocus maxLength={160} />
      <TextAreaField
        name="description"
        label={t.common.description}
        defaultValue={project?.description ?? ""}
        rows={3}
        optional
      />
      <TextAreaField
        name="objectives"
        label={t.projects.objectives}
        placeholder={t.projects.objectivesPlaceholder}
        defaultValue={project?.objectives ?? ""}
        rows={2}
        optional
      />
      <FormGrid>
        <SelectField
          name="poleId"
          label={t.common.pole}
          placeholder={t.projects.noPole}
          defaultValue={project?.poleId ?? ""}
          options={poles.map((p) => ({ value: p.id, label: p.name }))}
        />
        <SelectField
          name="leadId"
          label={t.common.lead}
          placeholder={t.common.nobody}
          defaultValue={project?.leadId ?? ""}
          options={members.map((m) => ({ value: m.id, label: m.name }))}
        />
        <SelectField
          name="status"
          label={t.common.status}
          defaultValue={project?.status ?? "PLANNED"}
          options={PROJECT_STATUSES.map((s) => ({ value: s, label: t.enums.projectStatus[s] }))}
        />
        <SelectField
          name="priority"
          label={t.common.priority}
          defaultValue={project?.priority ?? "MEDIUM"}
          options={PRIORITIES.map((p) => ({ value: p, label: t.enums.priority[p] }))}
        />
        <TextField
          type="date"
          name="startDate"
          label={t.common.startDate}
          defaultValue={toDateInput(project?.startDate)}
          optional
        />
        <TextField
          type="date"
          name="dueDate"
          label={t.common.dueDate}
          defaultValue={toDateInput(project?.dueDate)}
          optional
        />
        <TextField
          name="budget"
          inputMode="decimal"
          label={`${t.common.budget} (${currency})`}
          defaultValue={centsToInput(project?.budgetCents)}
          placeholder="0"
          optional
        />
        <SelectField
          name="progressMode"
          label={t.projects.progressMode}
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          options={[
            { value: "AUTO", label: t.projects.progressAuto },
            { value: "MANUAL", label: t.projects.progressManual },
          ]}
        />
      </FormGrid>
      {mode === "MANUAL" && (
        <RangeField
          name="manualProgress"
          label={t.projects.manualProgress}
          defaultValue={project?.manualProgress ?? 0}
        />
      )}
      <ColorField name="color" label={t.common.color} colors={COLORS} defaultValue={project?.color ?? "indigo"} />
    </>
  );
}
