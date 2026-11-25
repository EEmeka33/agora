import type { Metadata } from "next";
import { FolderKanban, GanttChart, LayoutGrid, Plus } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { requireContext } from "@/lib/context";
import { withParams } from "@/lib/url";
import { getI18n } from "@/lib/i18n/server";
import { can } from "@/lib/permissions";
import { getMemberOptions, getPoleOptions } from "@/lib/queries";
import { loadProjects } from "@/lib/project-queries";
import { createProject } from "@/actions/projects";
import { EmptyState, PageHeader, Segmented } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/forms/form-dialog";
import { FilterSelect, SearchInput } from "@/components/forms/filters";
import { ProjectFields } from "@/components/projects/project-fields";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectTimeline } from "@/components/projects/timeline";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage(props: PageProps<"/projects">) {
  const { user, db, association } = await requireContext();
  const { t } = await getI18n();
  const sp = await props.searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const view = get("view") === "timeline" ? "timeline" : "cards";
  const filter = ["all", "done"].includes(get("filter")) ? get("filter") : "active";

  const where: Prisma.ProjectWhereInput = {};
  if (filter === "active") where.status = { notIn: ["COMPLETED", "CANCELLED"] };
  if (filter === "done") where.status = { in: ["COMPLETED", "CANCELLED"] };
  if (get("pole")) where.poleId = get("pole");
  if (get("q")) where.title = { contains: get("q") };

  const [projects, members, poles, leadOf] = await Promise.all([
    loadProjects(db, where),
    getMemberOptions(db),
    getPoleOptions(db),
    db.poleMember.count({ where: { userId: user.id, role: "LEAD" } }),
  ]);
  const canCreate = can.createProject(user) || leadOf > 0;

  const qs = (patch: Record<string, string | null>) => withParams("/projects", sp, patch);

  const newProject = (autoOpen: boolean) =>
    canCreate && (
      <FormDialog
        title={t.projects.newProject}
        action={createProject}
        submitLabel={t.common.create}
        size="lg"
        defaultOpen={autoOpen && get("new") === "1"}
        trigger={
          <Button>
            <Plus /> {t.projects.newProject}
          </Button>
        }
      >
        <ProjectFields
          members={members}
          poles={poles}
          currency={association.currency}
          project={{ poleId: get("pole") || null, leadId: user.id }}
        />
      </FormDialog>
    );

  return (
    <>
      <PageHeader title={t.projects.title} description={t.projects.subtitle} actions={newProject(true)} />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Segmented
          items={[
            { href: qs({ filter: null }), label: t.projects.filters.active, active: filter === "active" },
            { href: qs({ filter: "done" }), label: t.projects.filters.done, active: filter === "done" },
            { href: qs({ filter: "all" }), label: t.projects.filters.all, active: filter === "all" },
          ]}
        />
        <SearchInput placeholder={t.common.searchPlaceholder} className="w-full sm:w-56" />
        <FilterSelect
          param="pole"
          placeholder={t.common.pole}
          options={poles.map((p) => ({ value: p.id, label: p.name }))}
        />
        <Segmented
          className="ml-auto"
          items={[
            { href: qs({ view: null }), label: t.common.cards, active: view === "cards", icon: <LayoutGrid /> },
            {
              href: qs({ view: "timeline" }),
              label: t.common.timeline,
              active: view === "timeline",
              icon: <GanttChart />,
            },
          ]}
        />
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban />}
          title={t.projects.emptyTitle}
          description={t.projects.emptyText}
          action={newProject(false)}
        />
      ) : view === "timeline" ? (
        <ProjectTimeline projects={projects} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </>
  );
}
