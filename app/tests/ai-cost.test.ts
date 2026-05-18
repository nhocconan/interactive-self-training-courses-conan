import { describe, it, expect } from "vitest";
import { estimateCostUSD } from "@/lib/ai/adapter";

describe("estimateCostUSD", () => {
  it("gpt-4o-mini cents per million", () => {
    // 1M in + 1M out for gpt-4o-mini = $0.15 + $0.60
    expect(estimateCostUSD("gpt-4o-mini", 1_000_000, 1_000_000)).toBeCloseTo(0.75, 4);
  });
  it("unknown model returns 0", () => {
    expect(estimateCostUSD("totally-fake-model", 1000, 1000)).toBe(0);
  });
});
