/*
 * Literal Tailwind class names per color so the compiler can find them.
 * Used for poles, projects, avatars, badges and status chips.
 */
export const colorStyles: Record<
  string,
  { solid: string; soft: string; text: string; dot: string; ring: string; bar: string; border: string }
> = {
  indigo: {
    solid: "bg-indigo-500 text-white",
    soft: "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300",
    text: "text-indigo-600 dark:text-indigo-400",
    dot: "bg-indigo-500",
    ring: "ring-indigo-500/30",
    bar: "bg-indigo-500",
    border: "border-indigo-500",
  },
  violet: {
    solid: "bg-violet-500 text-white",
    soft: "bg-violet-500/10 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
    text: "text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
    ring: "ring-violet-500/30",
    bar: "bg-violet-500",
    border: "border-violet-500",
  },
  sky: {
    solid: "bg-sky-500 text-white",
    soft: "bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
    text: "text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
    ring: "ring-sky-500/30",
    bar: "bg-sky-500",
    border: "border-sky-500",
  },
  teal: {
    solid: "bg-teal-500 text-white",
    soft: "bg-teal-500/10 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300",
    text: "text-teal-600 dark:text-teal-400",
    dot: "bg-teal-500",
    ring: "ring-teal-500/30",
    bar: "bg-teal-500",
    border: "border-teal-500",
  },
  emerald: {
    solid: "bg-emerald-500 text-white",
    soft: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    bar: "bg-emerald-500",
    border: "border-emerald-500",
  },
  lime: {
    solid: "bg-lime-500 text-white",
    soft: "bg-lime-500/15 text-lime-800 dark:bg-lime-400/15 dark:text-lime-300",
    text: "text-lime-700 dark:text-lime-400",
    dot: "bg-lime-500",
    ring: "ring-lime-500/30",
    bar: "bg-lime-500",
    border: "border-lime-500",
  },
  amber: {
    solid: "bg-amber-500 text-white",
    soft: "bg-amber-500/15 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    ring: "ring-amber-500/30",
    bar: "bg-amber-500",
    border: "border-amber-500",
  },
  orange: {
    solid: "bg-orange-500 text-white",
    soft: "bg-orange-500/10 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300",
    text: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
    ring: "ring-orange-500/30",
    bar: "bg-orange-500",
    border: "border-orange-500",
  },
  rose: {
    solid: "bg-rose-500 text-white",
    soft: "bg-rose-500/10 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
    ring: "ring-rose-500/30",
    bar: "bg-rose-500",
    border: "border-rose-500",
  },
  pink: {
    solid: "bg-pink-500 text-white",
    soft: "bg-pink-500/10 text-pink-700 dark:bg-pink-400/15 dark:text-pink-300",
    text: "text-pink-600 dark:text-pink-400",
    dot: "bg-pink-500",
    ring: "ring-pink-500/30",
    bar: "bg-pink-500",
    border: "border-pink-500",
  },
  slate: {
    solid: "bg-slate-500 text-white",
    soft: "bg-slate-500/10 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-400",
    ring: "ring-slate-500/30",
    bar: "bg-slate-400",
    border: "border-slate-400",
  },
};

export function colorOf(name: string | null | undefined) {
  return colorStyles[name ?? "indigo"] ?? colorStyles.indigo;
}

/** Which color represents each status/enum value. */
export const statusColor = {
  projectStatus: {
    IDEA: "slate",
    PLANNED: "sky",
    IN_PROGRESS: "indigo",
    ON_HOLD: "amber",
    COMPLETED: "emerald",
    CANCELLED: "rose",
  },
  taskStatus: { TODO: "slate", IN_PROGRESS: "sky", REVIEW: "violet", DONE: "emerald" },
  priority: { LOW: "slate", MEDIUM: "sky", HIGH: "amber", URGENT: "rose" },
  health: { ON_TRACK: "emerald", AT_RISK: "amber", OFF_TRACK: "rose" },
  stepStatus: { TODO: "slate", IN_PROGRESS: "sky", DONE: "emerald", SKIPPED: "slate" },
  eventType: {
    GENERAL_ASSEMBLY: "violet",
    BOARD_MEETING: "indigo",
    POLE_MEETING: "sky",
    EVENT: "rose",
    WORKSHOP: "amber",
    OTHER: "slate",
  },
  role: { ADMIN: "violet", MANAGER: "sky", MEMBER: "slate" },
  rsvp: { GOING: "emerald", MAYBE: "amber", NOT_GOING: "rose" },
  transactionType: { INCOME: "emerald", EXPENSE: "rose" },
  stepCategory: {
    PROJECT: "violet",
    LEGAL: "indigo",
    GOVERNANCE: "sky",
    FINANCE: "emerald",
    OPERATIONS: "amber",
    COMMUNICATION: "rose",
  },
} as const satisfies Record<string, Record<string, string>>;

export function colorFor(group: keyof typeof statusColor, value: string | null | undefined): string {
  const map = statusColor[group] as Record<string, string>;
  return (value && map[value]) || "slate";
}
