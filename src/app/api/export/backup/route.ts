import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";

/** Full JSON backup of the workspace (administrators only). Password hashes are excluded. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return new NextResponse("Forbidden", { status: 403 });
  const [
    association,
    users,
    poles,
    poleMembers,
    responsibilities,
    foundationSteps,
    projects,
    projectMembers,
    milestones,
    projectUpdates,
    tasks,
    taskComments,
    events,
    eventAttendees,
    announcements,
    transactions,
    memberships,
    documents,
    activities,
  ] = await Promise.all([
    db.association.findMany(),
    db.user.findMany({ omit: { passwordHash: true } }),
    db.pole.findMany(),
    db.poleMember.findMany(),
    db.responsibility.findMany(),
    db.foundationStep.findMany(),
    db.project.findMany(),
    db.projectMember.findMany(),
    db.milestone.findMany(),
    db.projectUpdate.findMany(),
    db.task.findMany(),
    db.taskComment.findMany(),
    db.event.findMany(),
    db.eventAttendee.findMany(),
    db.announcement.findMany(),
    db.transaction.findMany(),
    db.membership.findMany(),
    db.document.findMany(),
    db.activity.findMany(),
  ]);
  const body = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: 1,
      data: {
        association,
        users,
        poles,
        poleMembers,
        responsibilities,
        foundationSteps,
        projects,
        projectMembers,
        milestones,
        projectUpdates,
        tasks,
        taskComments,
        events,
        eventAttendees,
        announcements,
        transactions,
        memberships,
        documents,
        activities,
      },
    },
    null,
    2,
  );
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="agora-backup-${date}.json"`,
    },
  });
}
