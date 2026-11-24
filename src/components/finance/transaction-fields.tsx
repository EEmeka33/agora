"use client";

import * as React from "react";
import { FormGrid, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { useT } from "@/lib/i18n/client";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { centsToInput, cn, nowWall, toDateInput } from "@/lib/utils";

type Opt = { id: string; name: string };

export type TransactionValues = {
  label?: string;
  type?: string;
  amountCents?: number;
  category?: string;
  date?: Date | null;
  paymentMethod?: string | null;
  reference?: string | null;
  notes?: string | null;
  projectId?: string | null;
  poleId?: string | null;
};

export function TransactionFields({
  tx,
  projects,
  poles,
  currency,
}: {
  tx?: TransactionValues;
  projects: Opt[];
  poles: Opt[];
  currency: string;
}) {
  const t = useT();
  const [type, setType] = React.useState(tx?.type ?? "EXPENSE");
  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {(["EXPENSE", "INCOME"] as const).map((v) => (
          <label
            key={v}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition-colors",
              type === v
                ? v === "INCOME"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                : "text-muted-foreground hover:bg-hover",
            )}
          >
            <input
              type="radio"
              name="type"
              value={v}
              checked={type === v}
              onChange={() => setType(v)}
              className="sr-only"
            />
            {v === "INCOME" ? "+" : "−"} {t.enums.transactionType[v]}
          </label>
        ))}
      </div>
      <TextField
        name="label"
        label={t.finance.label}
        placeholder={t.finance.labelPlaceholder}
        defaultValue={tx?.label}
        required
        autoFocus
      />
      <FormGrid>
        <TextField
          name="amount"
          inputMode="decimal"
          label={`${t.common.amount} (${currency})`}
          defaultValue={centsToInput(tx?.amountCents)}
          required
          placeholder="0,00"
        />
        <TextField
          name="date"
          type="date"
          label={t.common.date}
          defaultValue={toDateInput(tx?.date ?? nowWall())}
          required
        />
        <SelectField
          key={type}
          name="category"
          label={t.common.category}
          defaultValue={tx?.category && (categories as readonly string[]).includes(tx.category) ? tx.category : "OTHER"}
          options={categories.map((c) => ({ value: c, label: t.enums.category[c] }))}
        />
        <SelectField
          name="paymentMethod"
          label={t.finance.paymentMethod}
          placeholder="—"
          defaultValue={tx?.paymentMethod ?? ""}
          options={PAYMENT_METHODS.map((m) => ({ value: m, label: t.enums.paymentMethod[m] }))}
        />
        <SelectField
          name="projectId"
          label={t.common.project}
          placeholder={t.common.none}
          defaultValue={tx?.projectId ?? ""}
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
        />
        <SelectField
          name="poleId"
          label={t.common.pole}
          placeholder={t.common.none}
          defaultValue={tx?.poleId ?? ""}
          options={poles.map((p) => ({ value: p.id, label: p.name }))}
        />
      </FormGrid>
      <TextField
        name="reference"
        label={t.finance.reference}
        placeholder={t.finance.referencePlaceholder}
        defaultValue={tx?.reference ?? ""}
        optional
      />
      <TextAreaField name="notes" label={t.common.notes} defaultValue={tx?.notes ?? ""} rows={2} optional />
    </>
  );
}
