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
