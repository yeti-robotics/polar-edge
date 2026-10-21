import { describe, expect, it } from "vitest";
import { CycleSchema } from "./types";

const cycle = {
  phase: "teleop" as const,
  cycleNumber: 1,
  startedAt: 1000,
  endedAt: 2000,
};

describe("CycleSchema fallback bucket", () => {
  it("allows a cycle without a manual estimate", () => {
    expect(CycleSchema.safeParse(cycle).success).toBe(true);
  });

  it.each([0, 1, 2, 3, 4, 5])("allows bucket %s", (bucket) => {
    expect(CycleSchema.safeParse({ ...cycle, bucket }).success).toBe(true);
  });

  it.each([-1, 6, 1.5])("rejects invalid bucket %s", (bucket) => {
    expect(CycleSchema.safeParse({ ...cycle, bucket }).success).toBe(false);
  });
});
