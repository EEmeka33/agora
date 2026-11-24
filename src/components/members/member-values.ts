import type { MemberValues } from "./member-fields";

/** Picks only the editable, non-sensitive fields of a user for client forms. */
export function memberValues(u: MemberValues & Record<string, unknown>): MemberValues {
  return {
    name: u.name,
    email: u.email,
    phone: u.phone,
    title: u.title,
    bio: u.bio,
    skills: u.skills,
    avatarColor: u.avatarColor,
    role: u.role,
    boardPosition: u.boardPosition,
    joinedAt: u.joinedAt,
  };
}
