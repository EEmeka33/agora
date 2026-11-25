"use client";

import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { ColorField, FormGrid, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { updateAssociation } from "@/actions/settings";
import { useT } from "@/lib/i18n/client";
import { ACCENTS, CURRENCIES, LOCALES } from "@/lib/constants";
import { centsToInput, toDateInput } from "@/lib/utils";

export type AssociationValues = {
  name: string;
  shortName: string | null;
  tagline: string | null;
  purpose: string | null;
  legalForm: string;
  registrationNumber: string | null;
  siret: string | null;
  foundedAt: Date | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  accentColor: string;
  locale: string;
  currency: string;
  membershipFeeCents: number | null;
  volunteerHourCents: number | null;
  fiscalYearStartMonth: number;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b py-6 first:pt-0 last:border-b-0 md:grid-cols-[200px_1fr]">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function AssociationForm({ value }: { value: AssociationValues }) {
  const t = useT();
  return (
    <ActionForm action={updateAssociation}>
      <Section title={t.settings.associationTitle}>
        <FormGrid>
          <TextField name="name" label={t.setup.associationName} defaultValue={value.name} required />
          <TextField name="shortName" label={t.setup.shortName} defaultValue={value.shortName ?? ""} optional />
        </FormGrid>
        <TextField name="tagline" label={t.settings.tagline} defaultValue={value.tagline ?? ""} optional />
        <TextAreaField
          name="purpose"
          label={t.setup.purpose}
          placeholder={t.setup.purposePlaceholder}
          defaultValue={value.purpose ?? ""}
          rows={3}
          optional
        />
      </Section>
      <Section title={t.settings.legalSection}>
        <FormGrid>
          <TextField name="legalForm" label={t.setup.legalForm} defaultValue={value.legalForm} />
          <TextField
            name="foundedAt"
            type="date"
            label={t.settings.foundedAt}
            defaultValue={toDateInput(value.foundedAt)}
            optional
          />
          <TextField
            name="registrationNumber"
            label={t.settings.registrationNumber}
            placeholder="W000000000"
            defaultValue={value.registrationNumber ?? ""}
            optional
          />
          <TextField name="siret" label={t.settings.siret} defaultValue={value.siret ?? ""} optional />
        </FormGrid>
      </Section>
      <Section title={t.settings.contactSection}>
        <FormGrid>
          <TextField name="email" type="email" label={t.common.email} defaultValue={value.email ?? ""} optional />
          <TextField name="phone" type="tel" label={t.common.phone} defaultValue={value.phone ?? ""} optional />
          <TextField
            name="website"
            type="url"
            label={t.settings.website}
            placeholder="https://"
            defaultValue={value.website ?? ""}
            optional
            className="sm:col-span-2"
          />
          <TextField
            name="address"
            label={t.settings.address}
            defaultValue={value.address ?? ""}
            optional
            className="sm:col-span-2"
          />
          <TextField name="postalCode" label={t.settings.postalCode} defaultValue={value.postalCode ?? ""} optional />
          <TextField name="city" label={t.setup.city} defaultValue={value.city ?? ""} optional />
          <TextField name="country" label={t.setup.country} defaultValue={value.country ?? ""} optional />
        </FormGrid>
      </Section>
      <Section title={t.settings.financeSection}>
        <FormGrid>
          <SelectField
            name="currency"
            label={t.setup.currency}
            defaultValue={value.currency}
            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          />
          <TextField
            name="volunteerHour"
            inputMode="decimal"
            label={t.settings.volunteerHourValue}
            defaultValue={centsToInput(value.volunteerHourCents)}
            optional
          />
          <TextField
            name="membershipFee"
            inputMode="decimal"
            label={t.settings.membershipFee}
            defaultValue={centsToInput(value.membershipFeeCents)}
            optional
          />
          <SelectField
            name="fiscalYearStartMonth"
            label={t.settings.fiscalYearStart}
            defaultValue={String(value.fiscalYearStartMonth)}
            options={t.settings.months.map((m, i) => ({ value: String(i + 1), label: m }))}
          />
        </FormGrid>
      </Section>
      <Section title={t.settings.brandSection}>
        <ColorField
          name="accentColor"
          label={t.settings.accentColor}
          colors={ACCENTS}
          defaultValue={value.accentColor}
        />
        <SelectField
          name="locale"
          label={t.setup.language}
          defaultValue={value.locale}
          options={LOCALES.map((l) => ({ value: l, label: t.enums.locale[l] }))}
          className="sm:max-w-xs"
        />
      </Section>
      <div className="flex justify-end pt-2">
        <SubmitButton pendingLabel={t.common.saving}>{t.common.saveChanges}</SubmitButton>
      </div>
    </ActionForm>
  );
}
