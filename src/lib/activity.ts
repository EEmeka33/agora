import "server-only";
import { db } from "./db";

export async function logActivity(input: {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
}) {
  try {
    await db.activity.create({
      data: {
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
