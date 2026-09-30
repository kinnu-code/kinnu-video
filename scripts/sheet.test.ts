import { describe, expect, it } from "vitest";
import { planSheet } from "./sheet";

describe("planSheet", () => {
  it("turns seconds into sorted, unique frame numbers", () => {
    expect(planSheet([2, 1, 1.01], 30, 640, 3).frames).toEqual([30, 60]);
  });

  it("uses at most `columns` per row and enough rows for every frame", () => {
    const plan = planSheet([1, 2, 3, 4, 5, 6, 7], 30, 640, 3);
    expect([plan.columns, plan.rows]).toEqual([3, 3]);
    expect(planSheet([1], 30, 640, 3).columns).toBe(1);
  });

  it("escapes commas inside the select expression", () => {
    expect(planSheet([1, 2], 30, 640, 3).filter).toBe("select=eq(n\\,30)+eq(n\\,60),scale=640:-1,tile=2x1:padding=8:color=white");
  });

  it("refuses an empty list", () => {
    expect(() => planSheet([], 30, 640, 3)).toThrow(/at least one/);
  });
});
