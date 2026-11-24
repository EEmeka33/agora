"use client";

import { CheckboxField, ColorField, FormGrid, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { useT } from "@/lib/i18n/client";
import { BOARD_POSITIONS, COLORS, ROLES } from "@/lib/constants";
import { toDateInput } from "@/lib/utils";

export type MemberValues = {
  name?: string;
  email?: string;
  phone?: string | null;
  title?: string | null;
  bio?: string | null;
  skills?: string | null;
  avatarColor?: string;
  role?: string;
  boardPosition?: string | null;
  joinedAt?: Date | null;
};

export function MemberFields({
  member,
  adminFields,
  poles,
  isNew,
}: {
  member?: MemberValues;
  /** Show role / board position / membership date (administrators). */
  adminFields?: boolean;
  /** Poles to pick from (creation only). */
  poles?: { id: string; name: string }[];
  isNew?: boolean;
}) {
  const t = useT();
  return (
    <>
      <FormGrid>
        <TextField name="name" label={t.common.name} defaultValue={member?.name} required autoFocus />
        <TextField name="email" type="email" label={t.common.email} defaultValue={member?.email} required />
        <TextField name="phone" type="tel" label={t.common.phone} defaultValue={member?.phone ?? ""} optional />
        <TextField
          name="title"
          label={t.members.jobTitle}
          placeholder={t.members.jobTitlePlaceholder}
          defaultValue={member?.title ?? ""}
          optional
        />
      </FormGrid>
      {adminFields && (
        <FormGrid>
          <SelectField
            name="role"
            label={t.members.role}
            hint={t.members.roleHint}
            defaultValue={member?.role ?? "MEMBER"}
            options={ROLES.map((r) => ({ value: r, label: t.enums.role[r] }))}
          />
          <SelectField
            name="boardPosition"
            label={t.members.boardPosition}
            placeholder={t.members.noBoardPosition}
            defaultValue={member?.boardPosition ?? ""}
            options={BOARD_POSITIONS.map((p) => ({ value: p, label: t.enums.boardPosition[p] }))}
          />
          <TextField
            name="joinedAt"
            type="date"
            label={t.members.joinedAt}
            defaultValue={toDateInput(member?.joinedAt ?? (isNew ? new Date() : null))}
          />
        </FormGrid>
      )}
      <TextAreaField name="bio" label={t.members.bio} defaultValue={member?.bio ?? ""} rows={2} optional />
      <TextField
        name="skills"
        label={t.members.skills}
        placeholder={t.members.skillsPlaceholder}
        defaultValue={member?.skills ?? ""}
        optional
      />
      <ColorField
        name="avatarColor"
        label={t.members.avatarColor}
        colors={COLORS}
        defaultValue={member?.avatarColor ?? "indigo"}
      />
      {poles && poles.length > 0 && (
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium">{t.common.poles}</legend>
          <div className="flex flex-wrap gap-2">
            {poles.map((p) => (
              <label key={p.id} className="cursor-pointer">
                <input type="checkbox" name="poles" value={p.id} className="peer sr-only" />
                <span className="inline-flex rounded-full border px-3 py-1 text-sm transition-colors peer-checked:border-primary/50 peer-checked:bg-primary-soft peer-checked:text-primary-soft-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                  {p.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {isNew && <CheckboxField name="invite" defaultChecked label={t.members.invite} hint={t.members.inviteCreated} />}
    </>
  );
}
