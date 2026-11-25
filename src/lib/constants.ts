// Allowed values for every enumerated field. Labels live in the i18n dictionaries.

export const ROLES = ["ADMIN", "MANAGER", "MEMBER"] as const;
export type Role = (typeof ROLES)[number];

export const BOARD_POSITIONS = [
  "PRESIDENT",
  "VICE_PRESIDENT",
  "SECRETARY",
  "DEPUTY_SECRETARY",
  "TREASURER",
  "DEPUTY_TREASURER",
  "BOARD_MEMBER",
] as const;
export type BoardPosition = (typeof BOARD_POSITIONS)[number];

export const MEMBER_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export const POLE_ROLES = ["LEAD", "MEMBER"] as const;

export const PROJECT_STATUSES = ["IDEA", "PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const HEALTH = ["ON_TRACK", "AT_RISK", "OFF_TRACK"] as const;
export type Health = (typeof HEALTH)[number];

export const STEP_STATUSES = ["TODO", "IN_PROGRESS", "DONE", "SKIPPED"] as const;
export type StepStatus = (typeof STEP_STATUSES)[number];

export const STEP_CATEGORIES = ["PROJECT", "LEGAL", "GOVERNANCE", "FINANCE", "OPERATIONS", "COMMUNICATION"] as const;
export type StepCategory = (typeof STEP_CATEGORIES)[number];

export const FREQUENCIES = ["ONGOING", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "ONE_OFF"] as const;

export const EVENT_TYPES = ["GENERAL_ASSEMBLY", "BOARD_MEETING", "POLE_MEETING", "EVENT", "WORKSHOP", "OTHER"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const RSVP = ["GOING", "MAYBE", "NOT_GOING"] as const;

export const TRANSACTION_TYPES = ["INCOME", "EXPENSE"] as const;

export const INCOME_CATEGORIES = ["MEMBERSHIP", "DONATION", "GRANT", "EVENT", "SALES", "SPONSORSHIP", "OTHER"] as const;

export const EXPENSE_CATEGORIES = [
  "SUPPLIES",
  "EVENT",
  "RENT",
  "INSURANCE",
  "BANK",
  "TRAVEL",
  "COMMUNICATION",
  "SOFTWARE",
  "FOOD",
  "OTHER",
] as const;

export const TRANSACTION_CATEGORIES = Array.from(
  new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]),
) as readonly string[];

export const PAYMENT_METHODS = ["CARD", "TRANSFER", "CASH", "CHECK", "ONLINE", "OTHER"] as const;

export const DOCUMENT_CATEGORIES = [
  "STATUTES",
  "RULES",
  "MINUTES",
  "FINANCE",
  "LEGAL",
  "COMMUNICATION",
  "GUIDE",
  "OTHER",
] as const;

/** Palette used for poles, projects, avatars and the accent color. */
export const COLORS = [
  "indigo",
  "violet",
  "sky",
  "teal",
  "emerald",
  "lime",
  "amber",
  "orange",
  "rose",
  "pink",
  "slate",
] as const;
export type ColorName = (typeof COLORS)[number];

export const ACCENTS = ["indigo", "violet", "sky", "teal", "emerald", "amber", "rose"] as const;

export const POLE_ICONS = [
  "layers",
  "megaphone",
  "calendar",
  "wallet",
  "handshake",
  "users",
  "heart",
  "palette",
  "code",
  "graduation",
  "leaf",
  "trophy",
  "music",
  "globe",
  "camera",
  "shield",
] as const;

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD"] as const;

export const REQUEST_STATUSES = ["OPEN", "TAKEN", "DONE", "CANCELLED"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** Instance-wide sign-up policy (env SIGNUP_MODE): open | invite | closed */
export function signupMode(): "open" | "invite" | "closed" {
  const v = process.env.SIGNUP_MODE;
  return v === "invite" || v === "closed" ? v : "open";
}

/** Whether any signed-in account may create a new association (env ALLOW_NEW_ASSOCIATIONS). */
export function newAssociationsAllowed() {
  return process.env.ALLOW_NEW_ASSOCIATIONS !== "false";
}
