import { describe, it, expect } from "vitest";
import { isLockedOut, recordLoginFailure, recordLoginSuccess } from "@/lib/login-lockout";

describe("login lockout", () => {
  it("starts unlocked", () => {
    const id = "fresh-" + Math.random();
    expect(isLockedOut(id)).toBe(false);
  });
  it("locks after 8 failures and unlocks on success", () => {
    const id = "user-" + Math.random();
    for (let i = 0; i < 8; i++) recordLoginFailure(id);
    expect(isLockedOut(id)).toBe(true);
    recordLoginSuccess(id);
    expect(isLockedOut(id)).toBe(false);
  });
});
