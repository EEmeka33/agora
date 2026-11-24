"use client";

import { FormGrid, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { useT } from "@/lib/i18n/client";
import { EVENT_TYPES } from "@/lib/constants";
import { toDateTimeInput } from "@/lib/utils";

type Opt = { id: string; name: string };

export type EventValues = {
  title?: string;
  description?: string | null;
  type?: string;
  startAt?: Date | null;
  endAt?: Date | null;
  location?: string | null;
  agenda?: string | null;
  poleId?: string | null;
  projectId?: string | null;
};

export function EventFields({ event, poles, projects }: { event?: EventValues; poles: Opt[]; projects: Opt[] }) {
  const t = useT();
  return (
    <>
      <TextField name="title" label={t.common.title} defaultValue={event?.title} required autoFocus />
      <FormGrid>
        <SelectField
          name="type"
          label={t.common.type}
          defaultValue={event?.type ?? "BOARD_MEETING"}
          options={EVENT_TYPES.map((v) => ({ value: v, label: t.enums.eventType[v] }))}
        />
        <TextField name="location" label={t.common.location} defaultValue={event?.location ?? ""} optional />
        <TextField
          name="startAt"
          type="datetime-local"
          label={t.events.startAt}
          defaultValue={toDateTimeInput(event?.startAt)}
          required
        />
        <TextField
          name="endAt"
          type="datetime-local"
          label={t.events.endAt}
          defaultValue={toDateTimeInput(event?.endAt)}
          optional
        />
        <SelectField
          name="poleId"
          label={t.common.pole}
          placeholder={t.common.none}
          defaultValue={event?.poleId ?? ""}
          options={poles.map((p) => ({ value: p.id, label: p.name }))}
        />
        <SelectField
          name="projectId"
          label={t.common.project}
          placeholder={t.common.none}
          defaultValue={event?.projectId ?? ""}
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
        />
      </FormGrid>
      <TextAreaField
        name="description"
        label={t.common.description}
        defaultValue={event?.description ?? ""}
        rows={2}
        optional
      />
      <TextAreaField
        name="agenda"
        label={t.events.agenda}
        placeholder={t.events.agendaPlaceholder}
        defaultValue={event?.agenda ?? ""}
        rows={4}
        optional
      />
    </>
  );
}
