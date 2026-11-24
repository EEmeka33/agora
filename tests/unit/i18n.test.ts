import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/en";
import { fr } from "@/lib/i18n/fr";
import { FOUNDATION_TEMPLATE } from "@/lib/foundation-template";
import * as C from "@/lib/constants";

function shape(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return [prefix];
  return Object.entries(obj).flatMap(([k, v]) => shape(v, prefix ? `${prefix}.${k}` : k));
}

describe("dictionaries", () => {
  it("French has exactly the same keys as English", () => {
    expect(shape(fr).sort()).toEqual(shape(en).sort());
  });
  it("every enum value has a label in both languages", () => {
    const groups: [keyof typeof en.enums, readonly string[]][] = [
      ["role", C.ROLES],
      ["boardPosition", C.BOARD_POSITIONS],
      ["projectStatus", C.PROJECT_STATUSES],
      ["priority", C.PRIORITIES],
      ["taskStatus", C.TASK_STATUSES],
      ["health", C.HEALTH],
      ["stepStatus", C.STEP_STATUSES],
      ["stepCategory", C.STEP_CATEGORIES],
      ["frequency", C.FREQUENCIES],
      ["eventType", C.EVENT_TYPES],
      ["rsvp", C.RSVP],
      ["category", C.TRANSACTION_CATEGORIES],
      ["paymentMethod", C.PAYMENT_METHODS],
      ["documentCategory", C.DOCUMENT_CATEGORIES],
    ];
    for (const [group, values] of groups) {
      for (const value of values) {
        expect(en.enums[group][value], `en.enums.${group}.${value}`).toBeTruthy();
        expect(fr.enums[group][value], `fr.enums.${group}.${value}`).toBeTruthy();
      }
    }
  });
  it("the founding template is fully translated", () => {
    for (const step of FOUNDATION_TEMPLATE) {
      expect(step.en.title && step.fr.title && step.en.description && step.fr.description).toBeTruthy();
    }
  });
});
