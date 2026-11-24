"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <h1 className="text-xl font-semibold">{t.common.genericError}</h1>
      {error.digest && <p className="font-mono text-xs text-muted-foreground">{error.digest}</p>}
      <Button onClick={reset} variant="outline" className="mt-2">
        <RotateCcw /> {t.common.back}
      </Button>
    </div>
  );
}
