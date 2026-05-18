import { describe, it, expect } from "vitest";
import { validatePassword } from "@/lib/password";

describe("password policy", () => {
  it("rejects too short", () => {
    expect(validatePassword("Short1!").ok).toBe(false);
  });
  it("rejects fewer than 3 character classes", () => {
    expect(validatePassword("alllowercase1234").ok).toBe(false);
  });
  it("rejects banned strings", () => {
    expect(validatePassword("MyPassword1!").ok).toBe(false);
  });
  it("accepts a strong password", () => {
    expect(validatePassword("Tr0ub4dor&3lephant").ok).toBe(true);
  });
});
