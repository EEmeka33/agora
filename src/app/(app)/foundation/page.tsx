import type { Metadata } from "next";
import { Lightbulb, PartyPopper, Plus, Rocket } from "lucide-react";
import { requireContext } from "@/lib/context";
import { getI18n } from "@/lib/i18n/server";
import { can } from "@/lib/permissions";
import { getMemberOptions } from "@/lib/queries";
import { STEP_CATEGORIES } from "@/lib/constants";
import { foundationProgress } from "@/lib/progress";
import { colorFor, colorOf } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { createStep, loadFoundationTemplate } from "@/actions/foundation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress, ProgressRing } from "@/components/ui/progress";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { FormDialog } from "@/components/forms/form-dialog";
import { ConfirmButton } from "@/components/forms/confirm-dialog";
import { StepFields } from "@/components/foundation/step-fields";
import { StepItem } from "@/components/foundation/step-item";

export const metadata: Metadata = { title: "Founding" };

export default async function FoundationPage() {
  const { user, db } = await requireContext();
  const { t } = await getI18n();
  const [steps, members] = await Promise.all([
    db.foundationStep.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { assignee: { select: { id: true, name: true, avatarColor: true } } },
    }),
    getMemberOptions(db),
  ]);
  const canManage = can.manageFoundation(user);
  const progress = foundationProgress(steps);
  const next = steps.find((s) => s.status === "IN_PROGRESS") ?? steps.find((s) => s.status === "TODO");
  const complete = progress.total > 0 && progress.done === progress.total;

  const addStep = canManage && (
    <FormDialog
      title={t.foundation.addStep}
      action={createStep}
      submitLabel={t.common.create}
      trigger={
        <Button variant={steps.length ? "outline" : "primary"}>
          <Plus /> {t.foundation.addStep}
        </Button>
      }
    >
      <StepFields members={members} />
    </FormDialog>
  );

  if (steps.length === 0) {
    return (
      <>
        <PageHeader title={t.foundation.title} description={t.foundation.subtitle} />
        <EmptyState
          icon={<Rocket />}
          title={t.foundation.emptyTitle}
          description={t.foundation.emptyText}
          action={
            canManage && (
              <div className="flex flex-wrap justify-center gap-2">
                <ConfirmButton
                  title={t.foundation.loadTemplate}
                  description={t.setup.starterChecklistHint}
                  confirmLabel={t.common.confirm}
                  action={loadFoundationTemplate}
                  destructive={false}
                >
                  <Button>
                    <Rocket /> {t.foundation.loadTemplate}
                  </Button>
                </ConfirmButton>
                {addStep}
              </div>
            )
          }
        />
      </>
    );
  }

  let index = 0;
  return (
    <>
      <PageHeader title={t.foundation.title} description={t.foundation.subtitle} actions={addStep} />

      <Card className="relative mb-8 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-6 p-6 md:grid-cols-[auto_1fr_1.1fr] md:items-center">
          <ProgressRing value={progress.percent} size={120} stroke={10} />
          <div>
            {complete ? (
              <>
                <p className="flex items-center gap-2 text-lg font-semibold">
                  <PartyPopper className="size-5 text-primary" /> {t.foundation.complete}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{t.foundation.completeText}</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-semibold tracking-tight">
                  {progress.percent}%{" "}
                  <span className="text-lg font-normal text-muted-foreground">{t.foundation.progressLabel}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.foundation.stepsDone(progress.done, progress.total)}
                </p>
                {next && (
                  <div className="mt-4 rounded-xl border bg-card/80 px-4 py-3">
                    <p className="text-xs font-medium text-primary">{t.foundation.nextStep}</p>
                    <p className="text-sm font-medium">{next.title}</p>
                    <p className="text-xs text-muted-foreground">{next.assignee?.name ?? t.common.unassigned}</p>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="space-y-2.5">
            {STEP_CATEGORIES.map((cat) => {
              const p = foundationProgress(steps.filter((s) => s.category === cat));
              if (!p.total) return null;
              return (
                <div key={cat}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium">{t.enums.stepCategory[cat]}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {p.done}/{p.total}
                    </span>
                  </div>
                  <Progress value={p.percent} color={colorFor("stepCategory", cat)} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <p className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
        <Lightbulb className="mt-0.5 size-4 shrink-0" />
        {t.foundation.tip}
      </p>

      <div className="space-y-6">
        {STEP_CATEGORIES.map((cat) => {
          const list = steps.filter((s) => s.category === cat);
          if (!list.length) return null;
          const p = foundationProgress(list);
          const c = colorOf(colorFor("stepCategory", cat));
          return (
            <section key={cat}>
              <div className="mb-2 flex items-center gap-3 px-1">
                <span className={cn("flex size-7 items-center justify-center rounded-lg text-xs font-bold", c.soft)}>
                  {STEP_CATEGORIES.indexOf(cat) + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-semibold">{t.enums.stepCategory[cat]}</h2>
                  <p className="text-xs text-muted-foreground">{t.foundation.categoryHints[cat]}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                    p.done === p.total ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                  )}
                >
                  {p.done}/{p.total}
                </span>
              </div>
              <Card className="p-1.5">
                <ol>
                  {list.map((step) => (
                    <StepItem
                      key={step.id}
                      step={step}
                      index={index++}
                      canManage={canManage}
                      canToggle={canManage || step.assigneeId === user.id}
                      members={members}
                    />
                  ))}
                </ol>
              </Card>
            </section>
          );
        })}
      </div>
    </>
  );
}
