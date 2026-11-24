import type { Health } from "./constants";
import { clamp, nowWall } from "./utils";

type ProgressInput = {
  progressMode: string;
  manualProgress: number;
  status: string;
  tasks: { status: string }[];
  milestones: { done: boolean }[];
};

/**
 * Project progress in percent.
 * - MANUAL: the value set by the project lead.
 * - AUTO: done tasks + done milestones over the total (milestones weigh 2 tasks).
 */
export function projectProgress(p: ProgressInput): number {
  if (p.status === "COMPLETED") return 100;
  if (p.progressMode === "MANUAL") return clamp(p.manualProgress, 0, 100);
  const doneTasks = p.tasks.filter((t) => t.status === "DONE").length;
  const doneMilestones = p.milestones.filter((m) => m.done).length;
  const total = p.tasks.length + p.milestones.length * 2;
  if (total === 0) return 0;
  return Math.round(((doneTasks + doneMilestones * 2) / total) * 100);
}

type HealthInput = {
  status: string;
  startDate: Date | null;
  dueDate: Date | null;
  progress: number;
};

/**
 * Health compares the elapsed share of the schedule with the progress made.
 * - past due & not completed → OFF_TRACK
 * - more than 25 points behind schedule → AT_RISK
 */
export function projectHealth(p: HealthInput, now = nowWall()): Health | null {
  if (["COMPLETED", "CANCELLED", "IDEA"].includes(p.status)) return null;
  if (!p.dueDate) return p.status === "ON_HOLD" ? "AT_RISK" : "ON_TRACK";
  const due = p.dueDate.getTime();
  if (now.getTime() > due) return "OFF_TRACK";
  if (p.status === "ON_HOLD") return "AT_RISK";
  if (!p.startDate) return "ON_TRACK";
  const start = p.startDate.getTime();
  if (due <= start || now.getTime() < start) return "ON_TRACK";
  const elapsed = ((now.getTime() - start) / (due - start)) * 100;
  return elapsed - p.progress > 25 ? "AT_RISK" : "ON_TRACK";
}

/** Share of founding steps done (skipped steps don't count). */
export function foundationProgress(steps: { status: string }[]) {
  const relevant = steps.filter((s) => s.status !== "SKIPPED");
  const done = relevant.filter((s) => s.status === "DONE").length;
  return {
    done,
    total: relevant.length,
    percent: relevant.length ? Math.round((done / relevant.length) * 100) : 0,
  };
}
