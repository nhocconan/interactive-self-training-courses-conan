import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rate-limit", () => {
  it("allows within budget and 429s past it", () => {
    const key = "test-key-" + Math.random();
    let allowed = 0;
    for (let i = 0; i < 31; i++) {
      const r = rateLimit("AUTH", key);
      if (r.allowed) allowed++;
    }
    // Budget is 30/min
    expect(allowed).toBeLessThanOrEqual(30);
    expect(allowed).toBeGreaterThanOrEqual(29);
  });
});
