import type { Metadata } from "next";
import { CheckSquare, Columns3, List, Plus } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { requireContext } from "@/lib/context";
import { withParams } from "@/lib/url";
import { getI18n } from "@/lib/i18n/server";
import { getMemberOptions, getPoleOptions, getProjectOptions } from "@/lib/queries";
import { loadTaskCards } from "@/lib/task-queries";
import { PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { createTask } from "@/actions/tasks";
import { EmptyState, PageHeader, Segmented } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/forms/form-dialog";
import { FilterSelect, SearchInput } from "@/components/forms/filters";
import { TaskFields } from "@/components/tasks/task-fields";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskTable } from "@/components/tasks/task-table";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage(props: PageProps<"/tasks">) {
  const { user, db } = await requireContext();
  const { t } = await getI18n();
  const sp = await props.searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const view = get("view") === "list" ? "list" : "board";
  const scope = ["mine", "unassigned"].includes(get("scope")) ? get("scope") : "all";

  const where: Prisma.TaskWhereInput = {};
  if (scope === "mine") where.assigneeId = user.id;
  if (scope === "unassigned") where.assigneeId = null;
  if (get("project")) where.projectId = get("project");
  if (get("pole")) where.poleId = get("pole");
  if (PRIORITIES.includes(get("priority") as never)) where.priority = get("priority");
  if (get("assignee")) where.assigneeId = get("assignee");
  if (get("q")) where.title = { contains: get("q") };

  const [tasks, members, projects, poles] = await Promise.all([
    loadTaskCards(db, where, user),
    getMemberOptions(db),
    getProjectOptions(db),
    getPoleOptions(db),
  ]);

  const qs = (patch: Record<string, string | null>) => withParams("/tasks", sp, patch);

  const memberOpts = members.map((m) => ({ id: m.id, name: m.name }));
  const projectOpts = projects.map((p) => ({ id: p.id, name: p.title }));
  const poleOpts = poles.map((p) => ({ id: p.id, name: p.name }));

  return (
    <>
      <PageHeader
        title={t.tasks.title}
        description={t.tasks.subtitle}
        actions={
          <FormDialog
            title={t.tasks.newTask}
            action={createTask}
            submitLabel={t.common.create}
            defaultOpen={get("new") === "1"}
            trigger={
              <Button>
                <Plus /> {t.tasks.newTask}
              </Button>
            }
          >
            <TaskFields
              members={memberOpts}
              projects={projectOpts}
              poles={poleOpts}
              task={{
                assigneeId: scope === "mine" ? user.id : null,
                projectId: get("project") || null,
                poleId: get("pole") || null,
              }}
            />
          </FormDialog>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Segmented
          items={[
            { href: qs({ scope: null }), label: t.tasks.scope.all, active: scope === "all" },
            { href: qs({ scope: "mine" }), label: t.tasks.scope.mine, active: scope === "mine" },
            { href: qs({ scope: "unassigned" }), label: t.tasks.scope.unassigned, active: scope === "unassigned" },
          ]}
        />
        <SearchInput placeholder={t.common.searchPlaceholder} className="w-full sm:w-52" />
        <FilterSelect
          param="project"
          placeholder={t.common.project}
          options={projectOpts.map((p) => ({ value: p.id, label: p.name }))}
        />
        <FilterSelect
          param="pole"
          placeholder={t.common.pole}
          options={poleOpts.map((p) => ({ value: p.id, label: p.name }))}
        />
        <FilterSelect
          param="priority"
          placeholder={t.common.priority}
          options={PRIORITIES.map((p) => ({ value: p, label: t.enums.priority[p] }))}
        />
        {scope === "all" && (
          <FilterSelect
            param="assignee"
            placeholder={t.common.assignee}
            options={memberOpts.map((m) => ({ value: m.id, label: m.name }))}
          />
        )}
        <Segmented
          className="ml-auto"
          items={[
            { href: qs({ view: null }), label: t.common.board, active: view === "board", icon: <Columns3 /> },
            { href: qs({ view: "list" }), label: t.common.list, active: view === "list", icon: <List /> },
          ]}
        />
      </div>

      {tasks.length === 0 && view === "list" ? (
        <EmptyState icon={<CheckSquare />} title={t.tasks.emptyTitle} description={t.tasks.emptyText} />
      ) : view === "board" ? (
        <>
          <TaskBoard tasks={tasks} />
          <p className="mt-3 hidden text-xs text-muted-foreground lg:block">{t.tasks.dragHint}</p>
        </>
      ) : (
        <div className="space-y-6">
          {TASK_STATUSES.map((status) => {
            const list = tasks.filter((x) => x.status === status);
            if (!list.length) return null;
            return <TaskTable key={status} title={t.enums.taskStatus[status]} status={status} tasks={list} />;
          })}
        </div>
      )}
    </>
  );
}
