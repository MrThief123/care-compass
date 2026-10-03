import { describe, expect, it } from "vitest";

import type { AnyOccurrence } from "@/types/domain";

import {
  ALERT_WINDOW_HOURS,
  MAX_ALERTS_PER_RUN,
  OVERDUE_GRACE_MINUTES,
  occurrenceIdentity,
  overdueAlertMessage,
  selectAlertable,
} from "./care-overdue-alerts-logic";

/*
 * INT-09 (PD-062): the pure rules, tested without a database or a clock. `now` is passed in.
 */
const NOW = new Date("2026-10-05T01:00:00.000Z"); // 12:00 Melbourne (AEDT)
const MIN = 60_000;

function at(minutesBeforeNow: number): string {
  return new Date(NOW.getTime() - minutesBeforeNow * MIN).toISOString();
}

function task(
  id: string,
  minutesBeforeNow: number,
  status: "planned" | "overdue" | "done" = "overdue",
): AnyOccurrence {
  return {
    key: `${id}:2026-10-05T00:00:00+11:00`,
    eventId: id,
    clientId: "client-1",
    title: `Task ${id}`,
    description: "",
    start: at(minutesBeforeNow),
    durationMinutes: 30,
    status,
  } as AnyOccurrence;
}

const plainEvent = (id: string, minutesBeforeNow: number): AnyOccurrence => ({
  key: `${id}:2026-10-05T00:00:00+11:00`,
  eventId: id,
  clientId: "client-1",
  title: `Event ${id}`,
  description: "",
  start: at(minutesBeforeNow),
  durationMinutes: 30,
  kind: "event",
});

describe("[INT-09] constants (PD-062, FD-04)", () => {
  it("[INT-09][AC-03] the grace is 30 minutes, the window 48 hours", () => {
    expect(OVERDUE_GRACE_MINUTES).toBe(30);
    expect(ALERT_WINDOW_HOURS).toBe(48);
  });

  it("[INT-09][AC-07] the per-run cap is 100", () => {
    expect(MAX_ALERTS_PER_RUN).toBe(100);
  });
});

describe("[INT-09][AC-03] selectAlertable", () => {
  it("[INT-09][AC-03] selects a task overdue by more than 30 minutes", () => {
    expect(selectAlertable([task("a", 31)], NOW).map((o) => o.eventId)).toEqual(["a"]);
  });

  it("[INT-09][AC-03] exactly 30 minutes overdue is selected, 29 is not", () => {
    expect(selectAlertable([task("a", 30)], NOW)).toHaveLength(1);
    expect(selectAlertable([task("a", 29)], NOW)).toHaveLength(0);
  });

  it("[INT-09][AC-03] exactly 48 hours ago is selected, older is not", () => {
    expect(selectAlertable([task("a", 48 * 60)], NOW)).toHaveLength(1);
    expect(selectAlertable([task("a", 48 * 60 + 1)], NOW)).toHaveLength(0);
  });

  it("[INT-09][AC-03] never selects a done or planned task", () => {
    expect(selectAlertable([task("a", 120, "done"), task("b", 120, "planned")], NOW)).toEqual([]);
  });

  it("[INT-09][AC-03] never selects a plain event, however old", () => {
    expect(selectAlertable([plainEvent("a", 120)], NOW)).toEqual([]);
  });

  it("[INT-09][AC-07] returns the oldest due first, so a capped run clears the longest wait first", () => {
    const ids = selectAlertable([task("new", 40), task("old", 600), task("mid", 90)], NOW).map(
      (o) => o.eventId,
    );
    expect(ids).toEqual(["old", "mid", "new"]);
  });
});

describe("[INT-09][AC-02] occurrenceIdentity", () => {
  it("[INT-09][AC-02] splits the key into event id and original start (the tracking row's key)", () => {
    expect(
      occurrenceIdentity("11111111-2222-4333-8444-555555555555:2026-10-05T09:00:00+11:00"),
    ).toEqual({
      eventId: "11111111-2222-4333-8444-555555555555",
      originalStart: "2026-10-05T09:00:00+11:00",
    });
  });
});

describe("[INT-09][AC-08] overdueAlertMessage (FD-03)", () => {
  it("[INT-09][AC-08] names the task, the client's full name and the Melbourne due time", () => {
    const message = overdueAlertMessage({
      title: "Morning medication",
      clientName: "Margaret Wells",
      start: "2026-10-02T23:00:00.000Z", // 09:00 AEST... 10:00 AEDT on 3 October
    });
    expect(message.subject).toBe("Schedule of Care Program — overdue care");
    expect(message.text).toBe(
      '"Morning medication" for Margaret Wells was due at 10:00 am on 3 October and has not been marked done. Log in to follow it up.',
    );
  });

  it("[INT-09][AC-08] uses Melbourne time on both sides of the daylight-saving change (4 October 2026)", () => {
    const before = overdueAlertMessage({
      title: "T",
      clientName: "C",
      start: "2026-10-03T15:00:00.000Z",
    });
    const after = overdueAlertMessage({
      title: "T",
      clientName: "C",
      start: "2026-10-03T23:00:00.000Z",
    });
    expect(before.text).toContain("1:00 am on 4 October");
    expect(after.text).toContain("10:00 am on 4 October");
  });

  it("[INT-09][AC-08] never mentions an upcoming reminder", () => {
    const { subject, text } = overdueAlertMessage({ title: "T", clientName: "C", start: at(60) });
    expect(`${subject} ${text}`).not.toMatch(/upcoming|reminder|soon/i);
  });
});
