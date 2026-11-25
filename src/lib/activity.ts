import "server-only";
import type { TenantDb } from "./tenant";

export async function logActivity(
  ctx: { db: TenantDb; association: { id: string } },
  input: {
    actorId: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    entityLabel?: string | null;
  },
) {
  try {
    await ctx.db.activity.create({
      data: {
        associationId: ctx.association.id,
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        entityLabel: input.entityLabel?.slice(0, 200) ?? null,
      },
    });
  } catch (error) {
    // Activity is best-effort: never fail a user action because of it.
    console.error("Failed to log activity", error);
  }
}
