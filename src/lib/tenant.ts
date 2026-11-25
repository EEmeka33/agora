import "server-only";
import { db } from "./db";

/**
 * Tenant isolation.
 *
 * `tenantDb(associationId)` returns a Prisma client that automatically restricts every
 * query to one association:
 *  - models with an `associationId` column get `associationId = …` added to their filters
 *    and to the data they create;
 *  - child models (pole members, milestones, comments, votes…) are filtered through
 *    their parent;
 *  - users are restricted to the members of the association.
 *
 * Creating child rows or linking records by id must still be validated by the caller
 * (see `assertRefs` in action-utils.ts).
 */
const DIRECT = new Set([
  "Member",
  "JoinCode",
  "Pole",
  "Responsibility",
  "FoundationStep",
  "Project",
  "Task",
  "Request",
  "Event",
  "Announcement",
  "Poll",
  "TimeEntry",
  "Transaction",
  "Dues",
  "Document",
  "Activity",
]);

const VIA: Record<string, (associationId: string) => Record<string, unknown>> = {
  PoleMember: (a) => ({ pole: { associationId: a } }),
  ProjectMember: (a) => ({ project: { associationId: a } }),
  Milestone: (a) => ({ project: { associationId: a } }),
  ProjectUpdate: (a) => ({ project: { associationId: a } }),
  TaskComment: (a) => ({ task: { associationId: a } }),
  EventAttendee: (a) => ({ event: { associationId: a } }),
  PollOption: (a) => ({ poll: { associationId: a } }),
  PollVote: (a) => ({ poll: { associationId: a } }),
  User: (a) => ({ memberships: { some: { associationId: a } } }),
};

const FILTERED = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
]);

type Args = { where?: Record<string, unknown>; data?: unknown; create?: Record<string, unknown> };

function addScope(where: Record<string, unknown> | undefined, scope: Record<string, unknown>) {
  const current = where ?? {};
  const and = current.AND === undefined ? [] : Array.isArray(current.AND) ? current.AND : [current.AND];
  return { ...current, AND: [...and, scope] };
}

export function tenantDb(associationId: string) {
  return db.$extends({
    name: "tenant",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const a = (args ?? {}) as Args;
          const scope = DIRECT.has(model) ? { associationId } : VIA[model]?.(associationId);
          if (!scope) return query(args);

          if (FILTERED.has(operation)) a.where = addScope(a.where, scope);

          if (DIRECT.has(model)) {
            if (operation === "create") a.data = { ...(a.data as object), associationId };
            if (operation === "createMany")
              a.data = (Array.isArray(a.data) ? a.data : [a.data]).map((d) => ({ ...(d as object), associationId }));
            if (operation === "upsert") a.create = { ...a.create, associationId };
          }
          return query(a as typeof args);
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof tenantDb>;
