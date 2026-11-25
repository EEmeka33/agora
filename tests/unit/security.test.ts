import { describe, expect, it } from "vitest";
import { newJoinCode, newToken, normalizeJoinCode, sha256 } from "@/lib/tokens";
import { passwordIssue } from "@/lib/password-policy";
import { parseDuration } from "@/lib/utils";

describe("join codes", () => {
  it("generates readable codes without ambiguous characters", () => {
    for (let i = 0; i < 200; i++) {
      const code = newJoinCode();
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/);
    }
  });
  it("normalizes what people type", () => {
    expect(normalizeJoinCode("green camps")).toBe("GREEN-CAMPS");
    expect(normalizeJoinCode("green-camps")).toBe("GREEN-CAMPS");
    expect(normalizeJoinCode("GREENCAMPS")).toBe("GREEN-CAMPS");
    expect(normalizeJoinCode("GREEN-CAMP0")).toBe(""); // 0 is not in the alphabet
    expect(normalizeJoinCode("too-short")).toBe("");
  });
});

describe("tokens", () => {
  it("are long, random and stored hashed", () => {
    const a = newToken();
    const b = newToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(sha256(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256(a)).not.toContain(a);
  });
});

describe("password policy", () => {
  it("requires 10 characters", () => {
    expect(passwordIssue("short1")).toBe("length");
    expect(passwordIssue("a reasonably long passphrase")).toBeNull();
  });
  it("rejects common and personal passwords", () => {
    expect(passwordIssue("password123")).toBe("common");
    expect(passwordIssue("aaaaaaaaaaaa")).toBe("common");
    expect(passwordIssue("camille-in-lyon", { email: "camille@example.org" })).toBe("personal");
  });
});

describe("durations", () => {
  it("understands the usual ways of writing time", () => {
    expect(parseDuration("1h30")).toBe(90);
    expect(parseDuration("2h")).toBe(120);
    expect(parseDuration("45min")).toBe(45);
    expect(parseDuration("45m")).toBe(45);
    expect(parseDuration("1:15")).toBe(75);
    expect(parseDuration("2,5")).toBe(150);
    expect(parseDuration("1.5")).toBe(90);
  });
  it("rejects nonsense and more than 24 hours", () => {
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("abc")).toBeNull();
    expect(parseDuration("0")).toBeNull();
    expect(parseDuration("25h")).toBeNull();
  });
});
