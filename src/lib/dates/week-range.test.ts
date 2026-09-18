import { describe, expect, it } from "vitest";

import { weekRange } from "./week-range";

describe("[UI-01][AC-01] weekRange", () => {
  it("returns Mon 30 Nov – Sun 6 Dec 2026 for a Wednesday in that week", () => {
    expect(weekRange("2026-12-02")).toEqual({ start: "2026-11-30", end: "2026-12-06" });
  });

  it("returns the same range when given the Monday itself", () => {
    expect(weekRange("2026-11-30")).toEqual({ start: "2026-11-30", end: "2026-12-06" });
  });

  it("returns the same range when given the Sunday itself", () => {
    expect(weekRange("2026-12-06")).toEqual({ start: "2026-11-30", end: "2026-12-06" });
  });

  it("spans a month boundary correctly", () => {
    expect(weekRange("2026-01-01")).toEqual({ start: "2025-12-29", end: "2026-01-04" });
  });
});
