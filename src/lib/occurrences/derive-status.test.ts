// @vitest-environment node
import { describe, expect, it } from "vitest";

import { deriveStatus, dueTime, type LatestCompletion } from "@/lib/occurrences/derive-status";

/*
 * F0-11 T-02 and T-03 (AC-02, AC-03), plus the CHG-009 rules (a plain event has no status) and
 * OQ-10 (Overdue is derived, an undone tick-off is Planned or Overdue again).
 */
const TASK = { start: "2026-11-30T09:00:00+11:00", completionMode: "manual" } as const;
const PLAIN = { start: "2026-11-30T14:00:00+11:00", completionMode: "automatic" } as const;

const BEFORE = new Date("2026-11-30T08:59:59+11:00");
const AT_START = new Date("2026-11-30T09:00:00+11:00");
const AFTER = new Date("2026-12-01T09:00:00+11:00");

function completion(overrides: Partial<LatestCompletion> = {}): LatestCompletion {
  return {
    action: "done",
    actorDisplayName: "Aisha Rahman",
    occurredAt: "2026-11-30T09:12:00+11:00",
    ...overrides,
  };
}

describe("[F0-11][AC-02] Overdue is derived", () => {
  it("[F0-11][AC-02] a task whose due time has passed with no completion is overdue", () => {
    expect(deriveStatus(TASK, undefined, AFTER)).toEqual({ kind: "task", status: "overdue" });
  });

  it("[F0-11][AC-02] a task before its due time is planned", () => {
    expect(deriveStatus(TASK, undefined, BEFORE)).toEqual({ kind: "task", status: "planned" });
  });

  it("[F0-11][AC-02] at the due time itself a task is already overdue (now is at or after due)", () => {
    expect(deriveStatus(TASK, undefined, AT_START)).toEqual({ kind: "task", status: "overdue" });
  });

  it("[F0-11][AC-02] the due time is the occurrence's start", () => {
    expect(dueTime(TASK)).toEqual(new Date("2026-11-30T09:00:00+11:00"));
  });

  it("[F0-11][AC-02] accepts now as an ISO string as well as a Date", () => {
    expect(deriveStatus(TASK, undefined, "2026-12-01T00:00:00Z")).toEqual({
      kind: "task",
      status: "overdue",
    });
  });
});

describe("[F0-11][AC-03] Done, with who did it", () => {
  it("[F0-11][AC-03] a task whose latest completion is done is done, with the actor's name and when", () => {
    expect(deriveStatus(TASK, completion(), AFTER)).toEqual({
      kind: "task",
      status: "done",
      actor: "Aisha Rahman",
      completedAt: "2026-11-30T09:12:00+11:00",
    });
  });

  it("[F0-11][AC-03] the actor is shown in full (PD-038 supersedes 'Aisha R.')", () => {
    const result = deriveStatus(TASK, completion({ actorDisplayName: "  Aisha   Rahman " }), AFTER);
    expect(result).toMatchObject({ status: "done", actor: "Aisha Rahman" });
  });

  it("[F0-11][AC-03] a task ticked off before its due time is done, not planned", () => {
    expect(deriveStatus(TASK, completion(), BEFORE)).toMatchObject({ status: "done" });
  });

  it("[F0-11][AC-03] a task ticked off is done however late it is (never overdue)", () => {
    const later = new Date("2027-06-01T00:00:00Z");
    expect(deriveStatus(TASK, completion(), later)).toMatchObject({ status: "done" });
  });
});

describe("[F0-11] undo (OQ-10)", () => {
  it("[F0-11] a task whose latest completion is 'undone' is planned again before its due time", () => {
    expect(deriveStatus(TASK, completion({ action: "undone" }), BEFORE)).toEqual({
      kind: "task",
      status: "planned",
    });
  });

  it("[F0-11] a task whose latest completion is 'undone' is overdue again after its due time", () => {
    expect(deriveStatus(TASK, completion({ action: "undone" }), AFTER)).toEqual({
      kind: "task",
      status: "overdue",
    });
  });

  it("[F0-11] an undone task carries no actor or completion time", () => {
    const result = deriveStatus(TASK, completion({ action: "undone" }), AFTER);
    expect(result).not.toHaveProperty("actor");
    expect(result).not.toHaveProperty("completedAt");
  });
});

describe("[F0-11] plain events have no status (CHG-009)", () => {
  it("[F0-11] a plain event is never planned, done or overdue, before or after it happens", () => {
    expect(deriveStatus(PLAIN, undefined, BEFORE)).toEqual({ kind: "event" });
    expect(deriveStatus(PLAIN, undefined, AFTER)).toEqual({ kind: "event" });
  });

  it("[F0-11] a plain event has no actor or completion time", () => {
    const result = deriveStatus(PLAIN, undefined, AFTER);
    expect(result).not.toHaveProperty("status");
    expect(result).not.toHaveProperty("actor");
    expect(result).not.toHaveProperty("completedAt");
  });

  it("[F0-11] an occurrence that was ticked off keeps its history even if the event is a plain event now", () => {
    // Switching a series to a plain event is forward only: past occurrences keep their status and actor.
    expect(deriveStatus(PLAIN, completion(), AFTER)).toMatchObject({
      kind: "task",
      status: "done",
      actor: "Aisha Rahman",
    });
    expect(deriveStatus(PLAIN, completion({ action: "undone" }), AFTER)).toMatchObject({
      kind: "task",
      status: "overdue",
    });
  });
});

describe("[F0-11] bad input", () => {
  it("[F0-11] throws for an occurrence start that is not a date-time", () => {
    expect(() => deriveStatus({ ...TASK, start: "soon" }, undefined, AFTER)).toThrow();
  });

  it("[F0-11] throws for a now that is not a date-time", () => {
    expect(() => deriveStatus(TASK, undefined, "yesterday")).toThrow();
  });
});
