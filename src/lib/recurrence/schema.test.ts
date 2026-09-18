import { describe, expect, it } from "vitest";

import { expandOccurrences } from "@/lib/recurrence/expand";
import { recurrenceRuleSchema } from "@/lib/recurrence/schema";

describe("recurrenceRuleSchema", () => {
  it("[F0-09][AC-07] fails validation with an interval error when interval is 0", () => {
    const result = recurrenceRuleSchema.safeParse({
      frequency: "weekly",
      interval: 0,
      anchor: "2026-11-30T09:00:00",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes("interval"))).toBe(true);
  });

  it("[F0-09][AC-07] fails validation with an interval error when interval is negative", () => {
    const result = recurrenceRuleSchema.safeParse({
      frequency: "daily",
      interval: -1,
      anchor: "2026-11-30T09:00:00",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes("interval"))).toBe(true);
  });

  it("[F0-09][AC-07] rejects an interval-0 rule when expanding occurrences", () => {
    expect(() =>
      expandOccurrences(
        { frequency: "weekly", interval: 0, anchor: "2026-11-30T09:00:00" },
        { start: "2026-11-30T00:00:00", end: "2026-12-14T00:00:00" },
      ),
    ).toThrow();
  });
});
