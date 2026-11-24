import { describe, expect, it } from "vitest";
import {
  centsToInput,
  formatMoney,
  initials,
  isOverdue,
  parseDateInput,
  parseMoneyToCents,
  toDateInput,
} from "@/lib/utils";

describe("money", () => {
  it("parses French and English decimals", () => {
    expect(parseMoneyToCents("12,50")).toBe(1250);
    expect(parseMoneyToCents("12.5")).toBe(1250);
    expect(parseMoneyToCents("1 200")).toBe(120000);
    expect(parseMoneyToCents("")).toBeNull();
    expect(parseMoneyToCents("abc")).toBeNull();
  });
  it("formats cents", () => {
    expect(formatMoney(1250, "EUR", "en")).toBe("€12.50");
    expect(formatMoney(120000, "EUR", "fr").replace(/\s/g, " ")).toBe("1 200 €");
    expect(centsToInput(1250)).toBe("12.50");
    expect(centsToInput(1200)).toBe("12");
  });
});

describe("dates", () => {
  it("round-trips date inputs", () => {
    const d = parseDateInput("2026-03-04");
    expect(d?.toISOString()).toBe("2026-03-04T00:00:00.000Z");
    expect(toDateInput(d)).toBe("2026-03-04");
  });
  it("parses datetime-local as wall time", () => {
    expect(parseDateInput("2026-03-04T18:30")?.toISOString()).toBe("2026-03-04T18:30:00.000Z");
  });
  it("detects overdue dates", () => {
    expect(isOverdue(new Date("2000-01-01"))).toBe(true);
    expect(isOverdue(new Date("2000-01-01"), true)).toBe(false);
    expect(isOverdue(null)).toBe(false);
  });
});

describe("initials", () => {
  it("takes first and last name", () => {
    expect(initials("Camille Martin")).toBe("CM");
    expect(initials("Jean-Pierre de la Fontaine")).toBe("JF");
    expect(initials("Yanis")).toBe("YA");
  });
});
