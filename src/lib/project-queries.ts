import "server-only";
import type { TenantDb } from "./tenant";
import type { Prisma } from "@/generated/prisma/client";
import { projectHealth, projectProgress } from "./progress";

export async function loadProjects(db: TenantDb, where: Prisma.ProjectWhereInput = {}) {
  const projects = await db.project.findMany({
    where,
    include: {
      pole: { select: { id: true, name: true, color: true, icon: true } },
      lead: { select: { id: true, name: true, avatarColor: true } },
      members: { include: { user: { select: { id: true, name: true, avatarColor: true } } } },
      tasks: { select: { status: true } },
      milestones: { select: { done: true } },
      transactions: { select: { type: true, amountCents: true } },
    },
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
  });
  return projects.map((p) => {
    const progress = projectProgress(p);
    const spentCents = p.transactions.filter((x) => x.type === "EXPENSE").reduce((s, x) => s + x.amountCents, 0);
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      priority: p.priority,
      color: p.color,
      startDate: p.startDate,
      dueDate: p.dueDate,
      budgetCents: p.budgetCents,
      spentCents,
      pole: p.pole,
      lead: p.lead,
      members: p.members.map((m) => m.user),
      progress,
      health: projectHealth({ ...p, progress }),
      tasksDone: p.tasks.filter((x) => x.status === "DONE").length,
      tasksTotal: p.tasks.length,
    };
  });
}

export type ProjectSummary = Awaited<ReturnType<typeof loadProjects>>[number];
