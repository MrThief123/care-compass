import { describe, expect, it } from "vitest";

import { expandOccurrences, recurrenceWindow } from "./expand";
import type { RecurrenceRule } from "./types";

describe("INT-07 indexed recurrence windows", () => {
  it("[INT-07][AC-01][PRD] keeps the valid anchor when later steps exceed the Date range", () => {
    const rule: RecurrenceRule = { frequency: "daily", interval: Number.MAX_SAFE_INTEGER, anchor: "2026-01-01T09:00:00" };
    const range = { start: "2026-01-01T00:00:00", end: "2026-01-03T00:00:00" };
    expect(recurrenceWindow(rule, range).count).toBe(1);
    expect(expandOccurrences(rule, range)).toEqual([{ start: rule.anchor, originalStart: rule.anchor }]);
  });
  for (const frequency of ["none", "daily", "weekly", "monthly", "yearly"] as const) {
    it(`[INT-07][AC-01][PRD] counts and seeks ${frequency} with anchor clamping and inclusive until`, () => {
      const rule: RecurrenceRule = {
        frequency,
        interval: 2,
        anchor: "2020-02-29T02:30:00",
        until: "2026-10-04",
      };
      const range = { start: "2024-01-01T00:00:00", end: "2027-01-01T00:00:00" };
      const reference = expandOccurrences(rule, range);
      const window = recurrenceWindow(rule, range);
      expect(window.count).toBe(reference.length);
      expect(Array.from({ length: window.count }, (_, i) => window.at(i))).toEqual(
        reference.map((x) => x.originalStart),
      );
      reference.forEach((row, i) => expect(window.indexOf(row.originalStart)).toBe(i));
      expect(window.indexOf("2024-01-01T23:59:59")).toBe(-1);
    });
  }
  it("[INT-07][AC-01][PRD] preserves exclusive range end, empty ranges and the engine safety cap", () => {
    const rule: RecurrenceRule = { frequency: "daily", interval: 1, anchor: "2000-01-01T09:00:00" };
    expect(recurrenceWindow(rule, { start: rule.anchor, end: rule.anchor }).count).toBe(0);
    expect(recurrenceWindow(rule, { start: rule.anchor, end: "2000-01-02T09:00:00" }).count).toBe(
      1,
    );
    expect(recurrenceWindow(rule, { start: rule.anchor, end: "2400-01-01T00:00:00" }).count).toBe(
      100_000,
    );
  });
});
