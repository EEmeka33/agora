"use client";

import { FormGrid, SelectField, TextField } from "@/components/forms/fields";
import { useT } from "@/lib/i18n/client";
import { nowWall, toDateInput } from "@/lib/utils";

type Opt = { id: string; name: string };

export function TimeFields({
  poles,
  projects,
  events,
  defaults,
}: {
  poles: Opt[];
  projects: Opt[];
  events?: Opt[];
  defaults?: { poleId?: string | null; projectId?: string | null; taskId?: string | null; eventId?: string | null };
}) {
  const t = useT();
  return (
    <>
      {defaults?.taskId && <input type="hidden" name="taskId" value={defaults.taskId} />}
      <FormGrid>
        <TextField name="date" type="date" label={t.common.date} defaultValue={toDateInput(nowWall())} required />
        <TextField
          name="duration"
          label={t.volunteering.duration}
          placeholder={t.volunteering.durationPlaceholder}
          hint={t.volunteering.durationHint}
          required
          autoFocus
        />
      </FormGrid>
      <TextField name="description" label={t.common.description} optional />
      <FormGrid>
        <SelectField
          name="poleId"
          label={t.common.pole}
          placeholder={t.common.none}
          defaultValue={defaults?.poleId ?? ""}
          options={poles.map((p) => ({ value: p.id, label: p.name }))}
        />
        <SelectField
          name="projectId"
          label={t.common.project}
          placeholder={t.common.none}
          defaultValue={defaults?.projectId ?? ""}
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
        />
        {events && events.length > 0 && (
          <SelectField
            name="eventId"
            label={t.nav.events}
            placeholder={t.common.none}
            defaultValue={defaults?.eventId ?? ""}
            options={events.map((e) => ({ value: e.id, label: e.name }))}
            className="sm:col-span-2"
          />
        )}
      </FormGrid>
    </>
  );
}
