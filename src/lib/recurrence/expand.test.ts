import { describe, expect, it } from "vitest";

import { expandOccurrences } from "@/lib/recurrence/expand";
import type { RecurrenceOverride, RecurrenceRule } from "@/lib/recurrence/types";

describe("expandOccurrences", () => {
  it("[F0-09][AC-01] returns exactly two occurrences for a weekly rule across a two-week range", () => {
    const rule: RecurrenceRule = {
      frequency: "weekly",
      interval: 1,
      anchor: "2026-11-30T09:00:00",
    };

    const occurrences = expandOccurrences(rule, {
      start: "2026-11-30T00:00:00",
      end: "2026-12-14T00:00:00",
    });

    expect(occurrences.map((o) => o.start)).toEqual(["2026-11-30T09:00:00", "2026-12-07T09:00:00"]);
  });

  it("[F0-09][AC-02] returns one occurrence for a yearly rule expanded 40 years ahead", () => {
    const rule: RecurrenceRule = {
      frequency: "yearly",
      interval: 1,
      anchor: "2026-11-30T09:00:00",
    };

    const occurrences = expandOccurrences(rule, {
      start: "2066-01-01T00:00:00",
      end: "2067-01-01T00:00:00",
    });

    expect(occurrences.map((o) => o.start)).toEqual(["2066-11-30T09:00:00"]);
  });

  it("[F0-09][AC-03] clamps a monthly rule anchored 31 Jan to 28 Feb in a non-leap year", () => {
    const rule: RecurrenceRule = {
      frequency: "monthly",
      interval: 1,
      anchor: "2027-01-31T09:00:00",
    };

    const occurrences = expandOccurrences(rule, {
      start: "2027-02-01T00:00:00",
      end: "2027-03-01T00:00:00",
    });

    expect(occurrences.map((o) => o.start)).toEqual(["2027-02-28T09:00:00"]);
  });

  it("[F0-09][AC-04] keeps every daily occurrence at 09:00 local time across the Australia/Melbourne DST change", () => {
    const rule: RecurrenceRule = {
      frequency: "daily",
      interval: 1,
      anchor: "2027-03-30T09:00:00",
    };

    const occurrences = expandOccurrences(rule, {
      start: "2027-03-30T00:00:00",
      end: "2027-04-09T00:00:00",
    });

    expect(occurrences).toHaveLength(10);
    for (const occurrence of occurrences) {
      expect(occurrence.start.endsWith("T09:00:00")).toBe(true);
    }
  });

  it("[F0-09][AC-05] excludes a cancelled occurrence while keeping the rest of the series", () => {
    const rule: RecurrenceRule = {
      frequency: "weekly",
      interval: 1,
      anchor: "2026-11-30T09:00:00",
    };
    const overrides: RecurrenceOverride[] = [{ type: "cancelled", originalStart: "2026-12-07T09:00:00" }];

    const occurrences = expandOccurrences(
      rule,
      { start: "2026-11-30T00:00:00", end: "2026-12-21T00:00:00" },
      overrides,
    );

    expect(occurrences.map((o) => o.start)).toEqual(["2026-11-30T09:00:00", "2026-12-14T09:00:00"]);
  });

  it("[F0-09][AC-06] moves an occurrence to its overridden start while preserving originalStart identity", () => {
    const rule: RecurrenceRule = {
      frequency: "weekly",
      interval: 1,
      anchor: "2026-11-30T09:00:00",
    };
    const overrides: RecurrenceOverride[] = [
      {
        type: "modified",
        originalStart: "2026-12-07T09:00:00",
        start: "2026-12-08T10:00:00",
      },
    ];

    const occurrences = expandOccurrences(
      rule,
      { start: "2026-11-30T00:00:00", end: "2026-12-21T00:00:00" },
      overrides,
    );

    const moved = occurrences.find((o) => o.originalStart === "2026-12-07T09:00:00");
    expect(moved).toBeDefined();
    expect(moved?.start).toBe("2026-12-08T10:00:00");
  });

  it("[F0-09][AC-08] expands 500 weekly rules over a 6-week range in under 100ms", () => {
    const rules: RecurrenceRule[] = Array.from({ length: 500 }, (_, i) => ({
      frequency: "weekly",
      interval: 1,
      anchor: `2026-11-${String(2 + (i % 7)).padStart(2, "0")}T09:00:00`,
    }));
    const range = { start: "2026-11-01T00:00:00", end: "2026-12-13T00:00:00" };

    const started = performance.now();
    for (const rule of rules) {
      expandOccurrences(rule, range);
    }
    const elapsed = performance.now() - started;

    expect(elapsed).toBeLessThan(100);
  });
});
