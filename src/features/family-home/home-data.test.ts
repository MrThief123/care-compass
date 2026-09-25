import { describe, expect, it } from "vitest";

import type { BudgetBucketKind, BudgetBucketSummary, Occurrence } from "@/types/domain";

import {
  RECENT_ACTIVITY_LIMIT,
  selectRecentActivity,
  sortOldestFirst,
  summariseBudget,
} from "./home-data";

function occurrence(
  fields: Pick<Occurrence, "title" | "start" | "status"> & Partial<Occurrence>,
): Occurrence {
  const eventId = `event-${fields.title.toLowerCase().replace(/\W+/g, "-")}`;
  return {
    key: `${eventId}:${fields.start}`,
    eventId,
    clientId: "client-margaret",
    description: "",
    durationMinutes: 60,
    ...fields,
  };
}

function bucket(kind: BudgetBucketKind, total: number, used: number): BudgetBucketSummary {
  const percentUsed = total === 0 ? 0 : Math.round((used / total) * 100);
  return {
    id: `bucket-margaret-${kind}`,
    kind,
    label: kind,
    total,
    used,
    remaining: total - used,
    percentUsed,
    state: "ok",
  };
}

describe("[FAM-UI-01][AC-03] summariseBudget", () => {
  it("adds the bucket figures and takes the percent used from the sums, not an average of the buckets", () => {
    // Margaret's design figures: 14,880 + 2,750 + 240 remaining of 24,000 + 5,000 + 3,000.
    const totals = summariseBudget([
      bucket("ndis", 24000, 9120),
      bucket("fixed", 5000, 2250),
      bucket("government", 3000, 2760),
    ]);

    expect(totals).toEqual({ total: 32000, used: 14130, remaining: 17870, percentUsed: 44 });
  });

  it("reports 0% used, rather than dividing by zero, when the buckets total nothing", () => {
    expect(summariseBudget([bucket("ndis", 0, 0)]).percentUsed).toBe(0);
    expect(summariseBudget([]).percentUsed).toBe(0);
  });
});

describe("[FAM-UI-01][AC-02] sortOldestFirst", () => {
  it("orders overdue occurrences oldest first without changing the list it was given", () => {
    const sunday = occurrence({
      title: "Weekly weigh-in",
      start: "2026-11-29T10:00:00+11:00",
      status: "overdue",
    });
    const friday = occurrence({
      title: "Wound dressing check",
      start: "2026-11-27T10:00:00+11:00",
      status: "overdue",
    });
    const saturday = occurrence({
      title: "Medication review",
      start: "2026-11-28T08:00:00+11:00",
      status: "overdue",
    });
    const input = [sunday, friday, saturday];

    expect(sortOldestFirst(input)).toEqual([friday, saturday, sunday]);
    expect(input).toEqual([sunday, friday, saturday]);
  });

  it("compares instants, not strings, so a different UTC offset cannot reorder two events", () => {
    // 23:00 on the 29th at +11:00 is 12:00 UTC; 09:00 on the 30th at +00:00 is later.
    const earlier = occurrence({
      title: "Evening dose",
      start: "2026-11-29T23:00:00+11:00",
      status: "overdue",
    });
    const later = occurrence({
      title: "Morning dose",
      start: "2026-11-30T09:00:00+00:00",
      status: "overdue",
    });

    expect(sortOldestFirst([later, earlier])).toEqual([earlier, later]);
  });
});

describe("[FAM-UI-01][Scope] selectRecentActivity", () => {
  const morning = occurrence({
    title: "Morning medication",
    start: "2026-11-30T09:00:00+11:00",
    status: "done",
    actor: "Aisha Rahman",
  });
  const evening = occurrence({
    title: "Evening medication",
    start: "2026-11-29T18:00:00+11:00",
    status: "done",
    actor: "Aisha Rahman",
  });
  const weighIn = occurrence({
    title: "Weekly weigh-in",
    start: "2026-11-29T10:00:00+11:00",
    status: "overdue",
  });
  const physio = occurrence({
    title: "Physiotherapy",
    start: "2026-11-28T11:30:00+11:00",
    status: "done",
    actor: "Aisha Rahman",
  });
  const review = occurrence({
    title: "Medication review",
    start: "2026-11-28T08:00:00+11:00",
    status: "overdue",
  });
  const wound = occurrence({
    title: "Wound dressing check",
    start: "2026-11-27T10:00:00+11:00",
    status: "overdue",
  });
  const plannedToday = occurrence({
    title: "Afternoon check-in",
    start: "2026-11-30T15:00:00+11:00",
    status: "planned",
  });

  it("keeps the five most recent done or overdue occurrences, newest first", () => {
    const log = [wound, physio, review, morning, weighIn, plannedToday, evening];

    expect(RECENT_ACTIVITY_LIMIT).toBe(5);
    expect(selectRecentActivity(log)).toEqual([morning, evening, weighIn, physio, review]);
  });

  it("leaves planned occurrences out, because they have not happened yet", () => {
    expect(selectRecentActivity([plannedToday, morning])).toEqual([morning]);
  });

  it("returns an empty list when there is no history", () => {
    expect(selectRecentActivity([])).toEqual([]);
    expect(selectRecentActivity([plannedToday])).toEqual([]);
  });

  it("does not change the list it was given", () => {
    const log = [wound, morning];
    selectRecentActivity(log);
    expect(log).toEqual([wound, morning]);
  });
});
