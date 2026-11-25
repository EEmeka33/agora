import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// A throw-away SQLite database, migrated like the real one.
const dir = mkdtempSync(path.join(tmpdir(), "agora-tenant-"));
const url = `file:${path.join(dir, "test.db")}`;
process.env.DATABASE_URL = url;

type Db = typeof import("@/lib/db").db;
type TenantDb = ReturnType<typeof import("@/lib/tenant").tenantDb>;
let db: Db;
let a: TenantDb;
let b: TenantDb;
const ids: Record<string, string> = {};

beforeAll(async () => {
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: url }, stdio: "ignore" });
  db = (await import("@/lib/db")).db;
  const { tenantDb } = await import("@/lib/tenant");
  const assoA = await db.association.create({ data: { name: "A" } });
  const assoB = await db.association.create({ data: { name: "B" } });
  ids.A = assoA.id;
  ids.B = assoB.id;
  a = tenantDb(assoA.id);
  b = tenantDb(assoB.id);
  const alice = await db.user.create({ data: { name: "Alice", email: "alice@test" } });
  const bob = await db.user.create({ data: { name: "Bob", email: "bob@test" } });
  ids.alice = alice.id;
  ids.bob = bob.id;
  await db.member.create({ data: { associationId: assoA.id, userId: alice.id } });
  await db.member.create({ data: { associationId: assoB.id, userId: bob.id } });
  const projectB = await db.project.create({ data: { associationId: assoB.id, title: "Secret project" } });
  ids.projectB = projectB.id;
  const milestoneB = await db.milestone.create({ data: { projectId: projectB.id, title: "Secret milestone" } });
  ids.milestoneB = milestoneB.id;
  await db.task.create({ data: { associationId: assoB.id, title: "Secret task", projectId: projectB.id } });
});

afterAll(async () => {
  await db?.$disconnect();
  rmSync(dir, { recursive: true, force: true });
});

describe("tenant isolation", () => {
  it("lists only the association's own rows", async () => {
    expect(await a.project.findMany()).toHaveLength(0);
    expect(await b.project.findMany()).toHaveLength(1);
    expect(await a.task.count()).toBe(0);
  });

  it("cannot read another association's row by id", async () => {
    expect(await a.project.findUnique({ where: { id: ids.projectB } })).toBeNull();
    expect(await a.project.findFirst({ where: { title: "Secret project" } })).toBeNull();
  });

  it("cannot update or delete another association's rows", async () => {
    await expect(a.project.update({ where: { id: ids.projectB }, data: { title: "Hacked" } })).rejects.toThrow();
    await expect(a.project.delete({ where: { id: ids.projectB } })).rejects.toThrow();
    expect((await a.task.updateMany({ data: { title: "Hacked" } })).count).toBe(0);
    expect((await a.task.deleteMany({})).count).toBe(0);
    expect((await db.project.findUnique({ where: { id: ids.projectB } }))?.title).toBe("Secret project");
  });

  it("filters child records through their parent", async () => {
    expect(await a.milestone.findUnique({ where: { id: ids.milestoneB } })).toBeNull();
    expect(await b.milestone.findUnique({ where: { id: ids.milestoneB } })).not.toBeNull();
    expect((await a.milestone.deleteMany({})).count).toBe(0);
  });

  it("only sees accounts that are members of the association", async () => {
    const users = await a.user.findMany();
    expect(users.map((u) => u.name)).toEqual(["Alice"]);
    expect(await a.user.findUnique({ where: { id: ids.bob } })).toBeNull();
  });

  it("forces the association id when creating", async () => {
    const created = await a.pole.create({ data: { associationId: ids.B, name: "Sneaky" } });
    expect(created.associationId).toBe(ids.A);
    await a.task.createMany({ data: [{ associationId: ids.B, title: "Sneaky task" }] });
    expect(await b.task.findFirst({ where: { title: "Sneaky task" } })).toBeNull();
    expect(await a.task.findFirst({ where: { title: "Sneaky task" } })).not.toBeNull();
  });

  it("scopes aggregates and group-bys", async () => {
    expect((await a.project.aggregate({ _count: true }))._count).toBe(0);
    const groups = await a.task.groupBy({ by: ["status"], _count: true });
    expect(groups.reduce((n, g) => n + g._count, 0)).toBe(1);
  });
});
