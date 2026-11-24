"use client";

import { FormGrid, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { useT } from "@/lib/i18n/client";
import { PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { toDateInput } from "@/lib/utils";

export type Opt = { id: string; name: string };

export type TaskFieldValues = {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  dueDate?: Date | string | null;
  projectId?: string | null;
  poleId?: string | null;
  assigneeId?: string | null;
};

export function TaskFields({
  task,
  members,
  projects,
  poles,
}: {
  task?: TaskFieldValues;
  members: Opt[];
  projects: Opt[];
  poles: Opt[];
}) {
  const t = useT();
  return (
    <>
      <TextField name="title" label={t.common.title} defaultValue={task?.title} required autoFocus maxLength={200} />
      <TextAreaField
        name="description"
        label={t.common.description}
        defaultValue={task?.description ?? ""}
        rows={3}
        optional
      />
      <FormGrid>
        <SelectField
          name="assigneeId"
          label={t.common.assignee}
          placeholder={t.common.unassigned}
          defaultValue={task?.assigneeId ?? ""}
          options={members.map((m) => ({ value: m.id, label: m.name }))}
        />
        <TextField
          type="date"
          name="dueDate"
          label={t.common.dueDate}
          defaultValue={toDateInput(task?.dueDate)}
          optional
        />
        <SelectField
          name="status"
          label={t.common.status}
          defaultValue={task?.status ?? "TODO"}
          options={TASK_STATUSES.map((s) => ({ value: s, label: t.enums.taskStatus[s] }))}
        />
        <SelectField
          name="priority"
          label={t.common.priority}
          defaultValue={task?.priority ?? "MEDIUM"}
          options={PRIORITIES.map((p) => ({ value: p, label: t.enums.priority[p] }))}
        />
        <SelectField
          name="projectId"
          label={t.common.project}
          placeholder={t.tasks.noProject}
          defaultValue={task?.projectId ?? ""}
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
        />
        <SelectField
          name="poleId"
          label={t.common.pole}
          placeholder={t.common.none}
          defaultValue={task?.poleId ?? ""}
          options={poles.map((p) => ({ value: p.id, label: p.name }))}
        />
      </FormGrid>
    </>
  );
}
