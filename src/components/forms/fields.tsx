"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useFieldError } from "./action-form";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { colorOf } from "@/lib/colors";

type Common = {
  name: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  optional?: boolean;
  className?: string;
};

function useFieldProps(name: string) {
  const error = useFieldError(name);
  const id = React.useId();
  return { error, id };
}

export function TextField({
  name,
  label,
  hint,
  optional,
  className,
  ...props
}: Common & Omit<React.ComponentProps<"input">, "name">) {
  const t = useT();
  const { error, id } = useFieldProps(name);
  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      optional={optional}
      optionalLabel={t.common.optional}
      className={className}
    >
      <Input id={id} name={name} aria-invalid={!!error || undefined} {...props} />
    </Field>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  optional,
  className,
  ...props
}: Common & Omit<React.ComponentProps<"textarea">, "name">) {
  const t = useT();
  const { error, id } = useFieldProps(name);
  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      optional={optional}
      optionalLabel={t.common.optional}
      className={className}
    >
      <Textarea id={id} name={name} aria-invalid={!!error || undefined} {...props} />
    </Field>
  );
}

export type Option = { value: string; label: string };

export function SelectField({
  name,
  label,
  hint,
  optional,
  className,
  options,
  placeholder,
  ...props
}: Common &
  Omit<React.ComponentProps<"select">, "name"> & {
    options: Option[];
    /** Adds an empty first option with this label. */
    placeholder?: string;
  }) {
  const t = useT();
  const { error, id } = useFieldProps(name);
  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      optional={optional}
      optionalLabel={t.common.optional}
      className={className}
    >
      <Select id={id} name={name} aria-invalid={!!error || undefined} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
  className,
}: {
  name: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  defaultChecked?: boolean;
  className?: string;
}) {
  const id = React.useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-hover/60 has-checked:border-primary/50 has-checked:bg-primary-soft/40",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 accent-[var(--primary)]"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

/** Radio swatches to pick a color. */
export function ColorField({
  name,
  label,
  colors,
  defaultValue,
}: {
  name: string;
  label?: React.ReactNode;
  colors: readonly string[];
  defaultValue?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      {label && <legend className="mb-1.5 text-[13px] font-medium">{label}</legend>}
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <label key={c} className="relative cursor-pointer" title={c}>
            <input
              type="radio"
              name={name}
              value={c}
              defaultChecked={(defaultValue ?? colors[0]) === c}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition peer-checked:ring-2 peer-focus-visible:ring-2 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100",
                colorOf(c).solid,
                colorOf(c).ring.replace("/30", ""),
              )}
            >
              <Check className="size-3.5" strokeWidth={3} />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Range slider with live value. */
export function RangeField({
  name,
  label,
  defaultValue = 0,
}: {
  name: string;
  label: React.ReactNode;
  defaultValue?: number;
}) {
  const [value, setValue] = React.useState(defaultValue);
  return (
    <Field
      label={
        <span className="flex justify-between">
          <span>{label}</span>
          <span className="text-muted-foreground tabular-nums">{value}%</span>
        </span>
      }
    >
      <input
        type="range"
        name={name}
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-[var(--primary)]"
      />
    </Field>
  );
}

export function FormGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>;
}
