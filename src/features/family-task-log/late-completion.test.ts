import { describe, expect, it } from "vitest";

import { lateCompletionNote } from "./late-completion";

const START = "2026-11-30T09:00:00+11:00";

function note(completedAt: string, status: "done" | "planned" | "overdue" = "done") {
  return lateCompletionNote({ status, start: START, completedAt });
}

describe("[FAM-16][AC-04] lateCompletionNote wording", () => {
  it("[FAM-16][AC-04] days and hours from one day", () => {
    expect(note("2026-12-02T12:00:00+11:00")).toBe("Completed 2 days, 3 hours late");
    expect(note("2026-12-02T09:00:00+11:00")).toBe("Completed 2 days late");
    expect(note("2026-12-01T10:40:00+11:00")).toBe("Completed 1 day, 1 hour late");
  });

  it("[FAM-16][AC-04] hours and minutes from one hour", () => {
    expect(note("2026-11-30T10:30:00+11:00")).toBe("Completed 1 hour, 30 minutes late");
    expect(note("2026-11-30T12:00:00+11:00")).toBe("Completed 3 hours late");
  });

  it("[FAM-16][AC-04] minutes under an hour; 1 is singular", () => {
    expect(note("2026-11-30T09:45:00+11:00")).toBe("Completed 45 minutes late");
    expect(note("2026-11-30T09:01:00+11:00")).toBe("Completed 1 minute late");
  });

  it("[FAM-16][AC-04] seconds are dropped, not rounded up", () => {
    expect(note("2026-11-30T09:01:59+11:00")).toBe("Completed 1 minute late");
  });
});

describe("[FAM-16][AC-02] lateCompletionNote is absent when not late", () => {
  it("[FAM-16][AC-02] on time, early, or under a minute late", () => {
    expect(note("2026-11-30T09:00:00+11:00")).toBeUndefined();
    expect(note("2026-11-30T08:30:00+11:00")).toBeUndefined();
    expect(note("2026-11-30T09:00:59+11:00")).toBeUndefined();
  });

  it("[FAM-16][AC-02] not done, no completion time, or a plain event", () => {
    expect(note("2026-12-02T12:00:00+11:00", "planned")).toBeUndefined();
    expect(note("2026-12-02T12:00:00+11:00", "overdue")).toBeUndefined();
    expect(lateCompletionNote({ status: "done", start: START })).toBeUndefined();
    expect(lateCompletionNote({ kind: "event", start: START } as never)).toBeUndefined();
  });
});
