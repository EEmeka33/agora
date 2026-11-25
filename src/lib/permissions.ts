import type { Role } from "./constants";

type Who = { id: string; role: Role | string };

export const isAdmin = (u: Who) => u.role === "ADMIN";
/** Admins and managers can manage the content of the workspace. */
export const isManager = (u: Who) => u.role === "ADMIN" || u.role === "MANAGER";

export const can = {
  manageAssociation: isAdmin,
  manageMembers: isAdmin,
  managePoles: isManager,
  manageStructure: isManager,
  manageFoundation: isManager,
  manageFinance: isManager,
  manageEvents: isManager,
  manageAnnouncements: isManager,
  /** Join codes: managers can invite members; only admins can give higher roles. */
  manageCodes: isManager,
  managePolls: isManager,
  /** Everyone can open a vote; its creator and managers can close or delete it. */
  editPoll: (u: Who, p: { createdById: string | null }) => isManager(u) || p.createdById === u.id,
  /** Requests: managers and the requester can cancel; pole leads and managers can assign. */
  cancelRequest: (u: Who, r: { requesterId: string | null }) => isManager(u) || r.requesterId === u.id,
  assignRequest: (u: Who, poleLeadIds: string[]) => isManager(u) || poleLeadIds.includes(u.id),
  deleteTimeEntry: (u: Who, e: { userId: string }) => isManager(u) || e.userId === u.id,
  createProject: isManager,
  /** Managers, the project lead, or a lead of the project's pole. */
  editProject: (u: Who, p: { leadId: string | null; poleLeadIds?: string[] }) =>
    isManager(u) || p.leadId === u.id || (p.poleLeadIds ?? []).includes(u.id),
  /** Everyone can create tasks. */
  createTask: () => true,
  /** Managers, the creator, the assignee or the project lead. */
  editTask: (u: Who, t: { creatorId: string | null; assigneeId: string | null; projectLeadId?: string | null }) =>
    isManager(u) || t.creatorId === u.id || t.assigneeId === u.id || t.projectLeadId === u.id,
  deleteTask: (u: Who, t: { creatorId: string | null; projectLeadId?: string | null }) =>
    isManager(u) || t.creatorId === u.id || t.projectLeadId === u.id,
  /** Everyone can add documents; managers and the uploader can delete. */
  editDocument: (u: Who, d: { uploadedById: string | null }) => isManager(u) || d.uploadedById === u.id,
  editProfile: (u: Who, targetId: string) => isAdmin(u) || u.id === targetId,
};
