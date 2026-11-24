import { describe, expect, it } from "vitest";
import { can } from "@/lib/permissions";

const admin = { id: "a", role: "ADMIN" };
const manager = { id: "m", role: "MANAGER" };
const member = { id: "u", role: "MEMBER" };

describe("permissions", () => {
  it("only admins manage members and the association", () => {
    expect(can.manageMembers(admin)).toBe(true);
    expect(can.manageMembers(manager)).toBe(false);
    expect(can.manageAssociation(member)).toBe(false);
  });
  it("project leads and pole leads can edit their project", () => {
    expect(can.editProject(member, { leadId: "u" })).toBe(true);
    expect(can.editProject(member, { leadId: "x", poleLeadIds: ["u"] })).toBe(true);
    expect(can.editProject(member, { leadId: "x", poleLeadIds: [] })).toBe(false);
    expect(can.editProject(manager, { leadId: "x" })).toBe(true);
  });
  it("members edit tasks they created or are assigned to", () => {
    expect(can.editTask(member, { creatorId: "u", assigneeId: null })).toBe(true);
    expect(can.editTask(member, { creatorId: null, assigneeId: "u" })).toBe(true);
    expect(can.editTask(member, { creatorId: "x", assigneeId: "y" })).toBe(false);
    expect(can.deleteTask(member, { creatorId: "x" })).toBe(false);
  });
  it("everyone edits their own profile", () => {
    expect(can.editProfile(member, "u")).toBe(true);
    expect(can.editProfile(member, "x")).toBe(false);
    expect(can.editProfile(admin, "x")).toBe(true);
  });
});
