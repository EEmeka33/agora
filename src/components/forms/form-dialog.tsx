"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import type { ActionState } from "@/lib/action-utils";
import { ActionForm, SubmitButton, type FormAction } from "./action-form";

/**
 * A dialog containing a form bound to a server action.
 * Uncontrolled (pass `trigger`) or controlled (pass `open` + `onOpenChange`).
 */
export function FormDialog({
  trigger,
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  title,
  description,
  action,
  submitLabel,
  children,
  size = "md",
  resetOnSuccess = true,
  successToast = true,
  onSuccess,
  destructive,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  action: FormAction;
  submitLabel?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  resetOnSuccess?: boolean;
  successToast?: boolean;
  onSuccess?: (state: NonNullable<ActionState>) => void;
  destructive?: boolean;
}) {
  const t = useT();
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen);
  const open = openProp ?? innerOpen;
  const setOpen = (v: boolean) => {
    setInnerOpen(v);
    onOpenChange?.(v);
    // Opened from a "?new=1" link: clean the URL once closed.
    if (!v && defaultOpen && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("new")) {
        url.searchParams.delete("new");
        window.history.replaceState(window.history.state, "", url);
      }
    }
  };
  // Remount the form each time the dialog opens so default values are fresh.
  const [formKey, setFormKey] = React.useState(0);

  return (
    <>
      {trigger && (
        <span
          className="contents"
          onClick={() => {
            setFormKey((k) => k + 1);
            setOpen(true);
          }}
        >
          {trigger}
        </span>
      )}
      <Dialog open={open} onOpenChange={setOpen} title={title} description={description} size={size}>
        <ActionForm
          key={formKey}
          action={action}
          resetOnSuccess={resetOnSuccess}
          successToast={successToast}
          onSuccess={(state) => {
            setOpen(false);
            onSuccess?.(state);
          }}
        >
          <div className="space-y-4 px-5 py-5">{children}</div>
          <div className="flex items-center justify-end gap-2 border-t bg-muted/40 px-5 py-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <SubmitButton variant={destructive ? "destructive" : "primary"} pendingLabel={t.common.saving}>
              {submitLabel ?? t.common.save}
            </SubmitButton>
          </div>
        </ActionForm>
      </Dialog>
    </>
  );
}
