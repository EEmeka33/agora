"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { CheckboxField, FormGrid, SelectField, TextAreaField, TextField } from "@/components/forms/fields";
import { useFieldError } from "@/components/forms/action-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

export function PollFields({ poles }: { poles: { id: string; name: string }[] }) {
  const t = useT();
  const [options, setOptions] = React.useState(["", ""]);
  const error = useFieldError("option");
  return (
    <>
      <TextField
        name="question"
        label={t.polls.question}
        placeholder={t.polls.questionPlaceholder}
        required
        autoFocus
      />
      <TextAreaField name="description" label={t.common.description} rows={2} optional />
      <fieldset className="space-y-2">
        <div className="flex items-center justify-between">
          <legend className="text-[13px] font-medium">{t.polls.options}</legend>
          <button
            type="button"
            onClick={() => setOptions([t.polls.yes, t.polls.no, t.polls.abstain])}
            className="text-xs font-medium text-primary hover:underline"
          >
            {t.polls.yesNo}
          </button>
        </div>
        {options.map((value, i) => (
          <div key={i} className="flex gap-2">
            <Input
              name="option"
              value={value}
              onChange={(e) => setOptions((o) => o.map((v, j) => (j === i ? e.target.value : v)))}
              placeholder={t.polls.option(i + 1)}
              aria-label={t.polls.option(i + 1)}
            />
            {options.length > 2 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOptions((o) => o.filter((_, j) => j !== i))}
                aria-label={t.common.remove}
              >
                <X />
              </Button>
            )}
          </div>
        ))}
        {error && <p className="text-xs text-destructive">{error}</p>}
        {options.length < 12 && (
          <Button variant="ghost" size="sm" onClick={() => setOptions((o) => [...o, ""])}>
            <Plus /> {t.polls.addOption}
          </Button>
        )}
      </fieldset>
      <FormGrid>
        <TextField name="closesAt" type="datetime-local" label={t.polls.closesAt} optional />
        <SelectField
          name="poleId"
          label={t.polls.audience}
          placeholder={t.polls.everyone}
          options={poles.map((p) => ({ value: p.id, label: p.name }))}
        />
      </FormGrid>
      <div className="space-y-2">
        <CheckboxField name="multiple" label={t.polls.multiple} />
        <CheckboxField name="anonymous" label={t.polls.anonymous} />
      </div>
    </>
  );
}
