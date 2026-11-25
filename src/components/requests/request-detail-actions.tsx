"use client";

import { RowActions } from "@/components/forms/row-actions";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { requestActions, TakeButton, type RequestCardData } from "./request-card";

export function RequestDetailActions({ request }: { request: RequestCardData }) {
  const t = useT();
  const items = requestActions(request, t);
  if (!(request.status === "OPEN" && request.canTake) && items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {request.status === "OPEN" && request.canTake && <TakeButton id={request.id} size="md" />}
      {items.length > 0 && (
        <RowActions
          items={items}
          trigger={
            <Button variant="outline" size="md">
              {t.common.more}
            </Button>
          }
        />
      )}
    </div>
  );
}
