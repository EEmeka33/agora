"use client";

import { ColorField, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { poleIcons } from "@/components/icons";
import { useT } from "@/lib/i18n/client";
import { COLORS, POLE_ICONS } from "@/lib/constants";

export function PoleFields({
  pole,
  members,
}: {
  pole?: { name?: string; description?: string | null; mission?: string | null; color?: string; icon?: string };
  /** When given, shows a "lead" picker (creation only). */
  members?: { id: string; name: string }[];
}) {
  const t = useT();
  return (
    <>
      <TextField name="name" label={t.common.name} defaultValue={pole?.name} required autoFocus maxLength={80} />
      <TextAreaField
        name="description"
        label={t.common.description}
        defaultValue={pole?.description ?? ""}
        rows={2}
        optional
      />
      <TextAreaField
        name="mission"
        label={t.poles.mission}
        placeholder={t.poles.missionPlaceholder}
        defaultValue={pole?.mission ?? ""}
        rows={2}
        optional
      />
      {members && (
        <SelectField
          name="leadId"
          label={t.common.lead}
          placeholder={t.common.nobody}
          options={members.map((m) => ({ value: m.id, label: m.name }))}
        />
      )}
      <ColorField name="color" label={t.common.color} colors={COLORS} defaultValue={pole?.color ?? "indigo"} />
      <fieldset>
        <legend className="mb-1.5 text-[13px] font-medium">{t.common.icon}</legend>
        <div className="grid grid-cols-8 gap-1.5">
          {POLE_ICONS.map((name) => {
            const Icon = poleIcons[name];
            return (
              <label key={name} className="cursor-pointer" title={name}>
                <input
                  type="radio"
                  name="icon"
                  value={name}
                  defaultChecked={(pole?.icon ?? "layers") === name}
                  className="peer sr-only"
                />
                <span className="relative flex aspect-square items-center justify-center rounded-lg border text-muted-foreground transition-colors peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary-soft-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring hover:bg-hover [&>svg]:size-4">
                  <Icon />
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}
