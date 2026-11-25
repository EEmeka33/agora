import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { TenantDb } from "./tenant";
import type { CurrentUser } from "./context";
import { can, isManager } from "./permissions";

const ORDER: Record<string, number> = { OPEN: 0, TAKEN: 1, DONE: 2, CANCELLED: 3 };

/** Requests shaped for cards, with what the current person may do on each. */
export async function loadRequests(db: TenantDb, where: Prisma.RequestWhereInput, user: CurrentUser, take = 200) {
  const rows = await db.request.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      pole: {
        select: {
          id: true,
          name: true,
          color: true,
          members: { select: { userId: true, role: true, user: { select: { id: true, name: true } } } },
        },
      },
      fromPole: { select: { name: true } },
      requester: { select: { name: true, avatarColor: true } },
      takenBy: { select: { id: true, name: true, avatarColor: true } },
    },
  });
  return rows
    .map((r) => {
      const inPole = r.pole.members.some((m) => m.userId === user.id);
      const leads = r.pole.members.filter((m) => m.role === "LEAD").map((m) => m.userId);
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        priority: r.priority,
        status: r.status,
        dueDate: r.dueDate,
        createdAt: r.createdAt,
        takenAt: r.takenAt,
        closedAt: r.closedAt,
        pole: { id: r.pole.id, name: r.pole.name, color: r.pole.color },
        fromPole: r.fromPole,
        requester: r.requester,
        takenBy: r.takenBy,
        taskId: r.taskId,
        projectId: r.projectId,
        canTake: r.status === "OPEN" && (inPole || isManager(user)),
        canAssign: can.assignRequest(user, leads),
        canCancel: can.cancelRequest(user, r),
        canRelease: r.takenById === user.id || isManager(user),
        poleMembers: r.pole.members.map((m) => m.user),
      };
    })
    .sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9));
}
