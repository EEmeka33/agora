"use client";

import { CheckboxField, TextAreaField, TextField } from "@/components/forms/fields";
import { useT } from "@/lib/i18n/client";

export function AnnouncementFields() {
  const t = useT();
  return (
    <>
      <TextField name="title" label={t.dashboard.announcementTitle} required autoFocus />
      <TextAreaField name="body" label={t.dashboard.announcementBody} rows={4} required />
      <CheckboxField name="pinned" label={t.dashboard.pin} />
    </>
  );
}
