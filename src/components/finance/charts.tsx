"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLocale, useT } from "@/lib/i18n/client";
import { formatMoney } from "@/lib/utils";

type Month = { label: string; income: number; expense: number };

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
  currency: string;
}) {
  const t = useT();
  const locale = useLocale();
  if (!active || !payload?.length) return null;
  const income = payload.find((p) => p.dataKey === "income")?.value ?? 0;
  const expense = payload.find((p) => p.dataKey === "expense")?.value ?? 0;
  return (
    <div className="min-w-44 rounded-lg border bg-popover px-3 py-2 text-xs pop-shadow">
      <p className="mb-1.5 font-medium capitalize">{label}</p>
      <p className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-sm bg-[var(--chart-income)]" /> {t.finance.income}
        </span>
        <span className="font-medium tabular-nums">{formatMoney(income, currency, locale)}</span>
      </p>
      <p className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-sm bg-[var(--chart-expense)]" /> {t.finance.expenses}
        </span>
        <span className="font-medium tabular-nums">{formatMoney(expense, currency, locale)}</span>
      </p>
      <p className="mt-1 flex justify-between gap-4 border-t pt-1">
        <span className="text-muted-foreground">{t.finance.balance}</span>
        <span className="font-semibold tabular-nums">{formatMoney(income - expense, currency, locale)}</span>
      </p>
    </div>
  );
}

/** Grouped columns: income vs expenses per month (amounts in cents). */
export function MonthlyChart({ data, currency }: { data: Month[]; currency: string }) {
  const t = useT();
  const locale = useLocale();
  const compact = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[var(--chart-income)]" /> {t.finance.income}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[var(--chart-expense)]" /> {t.finance.expenses}
        </span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="22%" margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              interval={0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v: number) => compact.format(v / 100)}
            />
            <Tooltip cursor={{ fill: "var(--hover)" }} content={<ChartTooltip currency={currency} />} />
            <Bar dataKey="income" fill="var(--chart-income)" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="expense" fill="var(--chart-expense)" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Horizontal bars with direct value labels (single series). */
export function CategoryBars({ data, currency }: { data: { label: string; value: number }[]; currency: string }) {
  const locale = useLocale();
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li
          key={d.label}
          title={`${d.label}: ${formatMoney(d.value, currency, locale)} (${Math.round((d.value / total) * 100)}%)`}
        >
          <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate">{d.label}</span>
            <span className="shrink-0 font-medium tabular-nums">{formatMoney(d.value, currency, locale)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-r-[4px] bg-[var(--chart-expense)]"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
