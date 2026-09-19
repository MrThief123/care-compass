// @vitest-environment node
import { describe, expect, it } from "vitest";

import { generateCompletedHistory } from "@/mocks/history";
import { OccurrenceSchema } from "@/types/domain";
import type { CareEvent } from "@/types/domain";

function event(overrides: Partial<CareEvent> = {}): CareEvent {
  return {
    id: "event-x",
    clientId: "client-x",
    title: "Daily task",
    description: "Do the task.",
    start: "2026-10-02T09:00:00+10:00",
    durationMinutes: 30,
    recurrenceFrequency: "daily",
    completionMode: "manual",
    ...overrides,
  };
}

describe("[UI-04][AC-09] generateCompletedHistory", () => {
  it("[UI-04][AC-09] expands a daily event from its start, keeping the wall-clock time across the daylight-saving change", () => {
    const rows = generateCompletedHistory(
      [{ event: event(), carers: ["Aisha Rahman"] }],
      "2026-10-07T00:00",
    );

    expect(rows.map((row) => row.start)).toEqual([
      "2026-10-02T09:00:00+10:00",
      "2026-10-03T09:00:00+10:00",
      "2026-10-04T09:00:00+11:00",
      "2026-10-05T09:00:00+11:00",
      "2026-10-06T09:00:00+11:00",
    ]);
  });

  it("[UI-04][AC-09] steps weekly and fortnightly events by 7 and 14 days", () => {
    const weekly = generateCompletedHistory(
      [
        {
          event: event({ start: "2026-09-05T11:30:00+10:00", recurrenceFrequency: "weekly" }),
          carers: ["Aisha Rahman"],
        },
      ],
      "2026-09-30T00:00",
    );
    const fortnightly = generateCompletedHistory(
      [
        {
          event: event({ start: "2026-09-05T10:00:00+10:00", recurrenceFrequency: "fortnightly" }),
          carers: ["Aisha Rahman"],
        },
      ],
      "2026-10-20T00:00",
    );

    expect(weekly.map((row) => row.start.slice(0, 10))).toEqual([
      "2026-09-05",
      "2026-09-12",
      "2026-09-19",
      "2026-09-26",
    ]);
    expect(fortnightly.map((row) => row.start.slice(0, 10))).toEqual([
      "2026-09-05",
      "2026-09-19",
      "2026-10-03",
      "2026-10-17",
    ]);
  });

  it("[UI-04][AC-09] excludes the end instant and stops before it", () => {
    const rows = generateCompletedHistory(
      [{ event: event(), carers: ["Aisha Rahman"] }],
      "2026-10-04T09:00",
    );

    expect(rows.map((row) => row.start.slice(0, 10))).toEqual(["2026-10-02", "2026-10-03"]);
  });

  it("[UI-04][AC-09] makes every row a completed occurrence of its event, keyed eventId:start", () => {
    const source = event({ title: "Wound dressing check", durationMinutes: 45 });

    const rows = generateCompletedHistory(
      [{ event: source, carers: ["Aisha Rahman", "Marcus Chen"] }],
      "2026-10-06T00:00",
    );

    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(OccurrenceSchema.safeParse(row).success).toBe(true);
      expect(row).toMatchObject({
        key: `event-x:${row.start}`,
        eventId: "event-x",
        clientId: "client-x",
        title: "Wound dressing check",
        description: "Do the task.",
        durationMinutes: 45,
        status: "done",
      });
      expect(row.actor).toBe(row.assignee);
      const minutesLate = (Date.parse(row.completedAt ?? "") - Date.parse(row.start)) / 60_000;
      expect(minutesLate).toBeGreaterThanOrEqual(2);
      expect(minutesLate).toBeLessThanOrEqual(18);
    }
  });

  it("[UI-04][AC-09] shares the work between carers in turn", () => {
    const rows = generateCompletedHistory(
      [{ event: event(), carers: ["Aisha Rahman", "Marcus Chen", "Fatima Ali"] }],
      "2026-10-08T00:00",
    );

    expect(rows.map((row) => row.actor)).toEqual([
      "Aisha Rahman",
      "Marcus Chen",
      "Fatima Ali",
      "Aisha Rahman",
      "Marcus Chen",
      "Fatima Ali",
    ]);
  });

  it("[UI-04][AC-09] returns the same rows every time, with no clock or randomness", () => {
    const series = [{ event: event(), carers: ["Aisha Rahman", "Marcus Chen"] }];

    expect(generateCompletedHistory(series, "2026-10-20T00:00")).toEqual(
      generateCompletedHistory(series, "2026-10-20T00:00"),
    );
  });

  it("[UI-04][AC-09] rejects a frequency it cannot expand and a series with no carers", () => {
    expect(() =>
      generateCompletedHistory(
        [{ event: event({ recurrenceFrequency: "monthly" }), carers: ["Aisha Rahman"] }],
        "2026-12-01T00:00",
      ),
    ).toThrow(/monthly/);
    expect(() =>
      generateCompletedHistory([{ event: event(), carers: [] }], "2026-10-07T00:00"),
    ).toThrow(/carer/);
  });
});
