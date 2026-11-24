import "server-only";
import { db } from "./db";
import type { Prisma } from "@/generated/prisma/client";
import type { CurrentUser } from "./auth";
import { can } from "./permissions";

export const PRIORITY_RANK: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

/** Tasks shaped for the board / lists, with a per-task edit permission. */
export async function loadTaskCards(where: Prisma.TaskWhereInput, user: CurrentUser) {
  const tasks = await db.task.findMany({
    where,
    include: {
      project: { select: { id: true, title: true, color: true, leadId: true } },
      assignee: { select: { id: true, name: true, avatarColor: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    take: 500,
  });
  return tasks
    .map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      commentCount: task._count.comments,
      canEdit: can.editTask(user, { ...task, projectLeadId: task.project?.leadId ?? null }),
      project: task.project ? { id: task.project.id, title: task.project.title, color: task.project.color } : null,
      assignee: task.assignee,
    }))
    .sort((a, b) => {
      // Overdue & urgent first, then by due date.
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && !b.dueDate) return -1;
      if (a.dueDate && b.dueDate && a.dueDate.getTime() !== b.dueDate.getTime())
        return a.dueDate.getTime() - b.dueDate.getTime();
      return (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
    });
}
