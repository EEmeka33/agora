import { describe, expect, it } from "vitest";
import { foundationProgress, projectHealth, projectProgress } from "@/lib/progress";

const base = { progressMode: "AUTO", manualProgress: 0, status: "IN_PROGRESS", tasks: [], milestones: [] };

describe("projectProgress", () => {
  it("is 0 without tasks or milestones", () => {
    expect(projectProgress(base)).toBe(0);
  });
  it("counts done tasks", () => {
    expect(
      projectProgress({
        ...base,
        tasks: [{ status: "DONE" }, { status: "TODO" }, { status: "REVIEW" }, { status: "DONE" }],
      }),
    ).toBe(50);
  });
  it("gives milestones twice the weight of a task", () => {
    expect(
      projectProgress({ ...base, tasks: [{ status: "TODO" }, { status: "TODO" }], milestones: [{ done: true }] }),
    ).toBe(50);
  });
  it("uses the manual value in MANUAL mode", () => {
    expect(projectProgress({ ...base, progressMode: "MANUAL", manualProgress: 70, tasks: [{ status: "TODO" }] })).toBe(
      70,
    );
  });
  it("is 100 when the project is completed", () => {
    expect(projectProgress({ ...base, status: "COMPLETED", tasks: [{ status: "TODO" }] })).toBe(100);
  });
});

describe("projectHealth", () => {
  const now = new Date("2026-06-15T00:00:00Z");
  it("is off track when past due", () => {
    expect(
      projectHealth({ status: "IN_PROGRESS", startDate: null, dueDate: new Date("2026-06-01"), progress: 90 }, now),
    ).toBe("OFF_TRACK");
  });
  it("is at risk when progress lags behind the schedule", () => {
    expect(
      projectHealth(
        { status: "IN_PROGRESS", startDate: new Date("2026-06-01"), dueDate: new Date("2026-06-21"), progress: 10 },
        now,
      ),
    ).toBe("AT_RISK");
  });
  it("is on track when progress follows the schedule", () => {
    expect(
      projectHealth(
        { status: "IN_PROGRESS", startDate: new Date("2026-06-01"), dueDate: new Date("2026-06-21"), progress: 60 },
        now,
      ),
    ).toBe("ON_TRACK");
  });
  it("has no health once completed", () => {
    expect(
      projectHealth({ status: "COMPLETED", startDate: null, dueDate: new Date("2026-01-01"), progress: 100 }, now),
    ).toBeNull();
  });
});

describe("foundationProgress", () => {
  it("ignores skipped steps", () => {
    expect(foundationProgress([{ status: "DONE" }, { status: "SKIPPED" }, { status: "TODO" }])).toEqual({
      done: 1,
      total: 2,
      percent: 50,
    });
  });
});
