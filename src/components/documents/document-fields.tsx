"use client";

import { FormGrid, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { useT } from "@/lib/i18n/client";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";

type Opt = { id: string; name: string };

export function DocumentMetaFields({
  doc,
  poles,
  projects,
  showUrl,
}: {
  doc?: {
    title?: string;
    description?: string | null;
    category?: string;
    url?: string | null;
    poleId?: string | null;
    projectId?: string | null;
  };
  poles: Opt[];
  projects: Opt[];
  showUrl?: boolean;
}) {
  const t = useT();
  return (
    <>
      <TextField name="title" label={t.common.title} defaultValue={doc?.title} required />
      {showUrl && (
        <TextField
          name="url"
          type="url"
          label={t.common.link}
          placeholder={t.documents.urlPlaceholder}
          defaultValue={doc?.url ?? ""}
        />
      )}
      <FormGrid>
        <SelectField
          name="category"
          label={t.common.category}
          defaultValue={doc?.category ?? "OTHER"}
          options={DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: t.enums.documentCategory[c] }))}
        />
        <SelectField
          name="poleId"
          label={t.common.pole}
          placeholder={t.common.none}
          defaultValue={doc?.poleId ?? ""}
          options={poles.map((p) => ({ value: p.id, label: p.name }))}
        />
        <SelectField
          name="projectId"
          label={t.common.project}
          placeholder={t.common.none}
          defaultValue={doc?.projectId ?? ""}
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
          className="sm:col-span-2"
        />
      </FormGrid>
      <TextAreaField
        name="description"
        label={t.common.description}
        defaultValue={doc?.description ?? ""}
        rows={2}
        optional
      />
    </>
  );
}
