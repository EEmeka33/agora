import { NextResponse } from "next/server";
import { getContext } from "@/lib/context";
import { isAdmin } from "@/lib/permissions";
import { fileName } from "@/lib/api";

/**
 * JSON backup of the current association (administrators only).
 * Never contains password hashes, sessions or tokens.
 */
export async function GET() {
  const ctx = await getContext();
  if (!ctx || !isAdmin(ctx.user)) return new NextResponse("Forbidden", { status: 403 });
  const { db, association } = ctx;
  const userSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    bio: true,
    skills: true,
    avatarColor: true,
    locale: true,
    createdAt: true,
  } as const;
  const [
    members,
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
    requests,
    events,
    eventAttendees,
    announcements,
    polls,
    pollOptions,
    pollVotes,
    timeEntries,
    transactions,
    dues,
    documents,
    joinCodes,
    activities,
  ] = await Promise.all([
    db.member.findMany(),
    db.user.findMany({ select: userSelect }),
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
    db.request.findMany(),
    db.event.findMany(),
    db.eventAttendee.findMany(),
    db.announcement.findMany(),
    db.poll.findMany(),
    db.pollOption.findMany(),
    db.pollVote.findMany(),
    db.timeEntry.findMany(),
    db.transaction.findMany(),
    db.dues.findMany(),
    db.document.findMany(),
    db.joinCode.findMany(),
    db.activity.findMany(),
  ]);
  const body = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: 2,
      association,
      data: {
        members,
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
        requests,
        events,
        eventAttendees,
        announcements,
        polls,
        pollOptions,
        pollVotes,
        timeEntries,
        transactions,
        dues,
        documents,
        joinCodes,
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
      "Content-Disposition": `attachment; filename="${fileName(association.name)}-backup-${date}.json"`,
    },
  });
}
