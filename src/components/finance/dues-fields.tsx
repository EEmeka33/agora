"use client";

import { FormGrid, SelectField, TextField } from "@/components/forms/fields";
import { useT } from "@/lib/i18n/client";
import { PAYMENT_METHODS } from "@/lib/constants";
import { centsToInput, nowWall, toDateInput } from "@/lib/utils";

export function DuesFields({
  members,
  year,
  feeCents,
  userId,
  currency,
}: {
  members: { id: string; name: string }[];
  year: number;
  feeCents: number | null;
  userId?: string;
  currency: string;
}) {
  const t = useT();
  return (
    <>
      <input type="hidden" name="year" value={year} />
      <SelectField
        name="userId"
        label={t.common.member}
        placeholder={t.common.selectPlaceholder}
        defaultValue={userId ?? ""}
        options={members.map((m) => ({ value: m.id, label: m.name }))}
        required
      />
      <FormGrid>
        <TextField
          name="amount"
          inputMode="decimal"
          label={`${t.finance.feeAmount} (${currency})`}
          defaultValue={centsToInput(feeCents)}
          required
        />
        <TextField name="paidAt" type="date" label={t.finance.paidOn} defaultValue={toDateInput(nowWall())} required />
        <SelectField
          name="method"
          label={t.finance.paymentMethod}
          placeholder="—"
          options={PAYMENT_METHODS.map((m) => ({ value: m, label: t.enums.paymentMethod[m] }))}
          className="sm:col-span-2"
        />
      </FormGrid>
    </>
  );
}
