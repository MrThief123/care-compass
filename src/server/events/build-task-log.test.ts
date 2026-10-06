// @vitest-environment node
import { expect, it } from "vitest";

import { queryTaskLog } from "@/mocks/queries/events";

import { buildOccurrences, type BuildOccurrencesInput, type EventRow } from "./build-occurrences";
import { buildTaskLog } from "./build-task-log";

const event = (id: string, changes: Partial<EventRow> = {}): EventRow => ({
  id,
  client_id: "client",
  title: "Care " + id,
  description: "Synthetic",
  starts_at: "2026-03-28T02:30:00+11:00",
  duration_minutes: 30,
  recurrence: { frequency: "daily", interval: 1 },
  recurrence_until: null,
  completion_mode: "manual",
  is_active: true,
  deactivated_at: null,
  created_at: "2026-01-01T00:00:00Z",
  ...changes,
});

function fixture(): BuildOccurrencesInput {
  return {
    events: [
      event("a"),
      event("b", { completion_mode: "automatic" }),
      event("c", {
        recurrence: { frequency: "monthly", interval: 1 },
        starts_at: "2026-01-31T09:00:00+11:00",
        recurrence_until: "2026-10-01",
      }),
      event("d", { is_active: false, deactivated_at: "2026-04-05T02:30:00+11:00" }),
      event("e", { recurrence: null }),
    ],
    overrides: [
      {
        event_id: "a",
        original_start: "2026-04-02T02:30:00+11:00",
        kind: "cancelled",
        new_starts_at: null,
        new_duration_minutes: null,
        new_completion_mode: null,
      },
      {
        event_id: "a",
        original_start: "2026-04-03T02:30:00+11:00",
        kind: "modified",
        new_starts_at: "2026-10-05T10:00:00+11:00",
        new_duration_minutes: 60,
        new_completion_mode: "automatic",
      },
      {
        event_id: "b",
        original_start: "2026-04-04T02:30:00+11:00",
        kind: "modified",
        new_starts_at: "2026-03-29T10:00:00+11:00",
        new_duration_minutes: null,
        new_completion_mode: "manual",
      },
    ],
    completions: [
      {
        event_id: "a",
        original_start: "2026-04-01T02:30:00+11:00",
        action: "done",
        actor_display_name: "Synthetic Carer",
        occurred_at: "2026-04-01T03:00:00+11:00",
        seq: 1,
      },
      {
        event_id: "a",
        original_start: "2026-04-01T02:30:00+11:00",
        action: "undone",
        actor_display_name: "Synthetic Carer",
        occurred_at: "2026-04-01T03:30:00+11:00",
        seq: 2,
      },
      {
        event_id: "b",
        original_start: "2026-04-05T02:30:00+11:00",
        action: "done",
        actor_display_name: "Synthetic Carer",
        occurred_at: "2026-04-05T03:00:00+10:00",
        seq: 3,
      },
    ],
    shifts: [
      {
        carer_display_name: "Synthetic Assignee",
        starts_at: "2026-03-28T00:00:00+11:00",
        ends_at: "2026-04-06T00:00:00+10:00",
      },
    ],
    range: { from: "2026-03-28T00:00:00+11:00", to: "2026-10-05T00:00:00+11:00" },
    now: new Date("2026-04-05T02:15:00+10:00"),
  };
}

it("[INT-07][AC-01][PRD] preserves whole-history filters, totals, ordering, pages, overrides, completions and DST", () => {
  const input = fixture();
  const reference = buildOccurrences(input);
  for (const type of [undefined, "tasks", "events", "all"] as const)
    for (const status of [undefined, "planned", "overdue", "done"] as const)
      for (const q of [undefined, " care A ", "missing"])
        for (const page of [1, 2, 12, Number.MAX_SAFE_INTEGER]) {
          const query = { type, status, q, page };
          expect(buildTaskLog(input, query)).toEqual(queryTaskLog(reference, query));
        }
});

it("[INT-07][AC-01][PRD] preserves empty and unknown-client results", () => {
  const input = { ...fixture(), events: [] };
  expect(buildTaskLog(input, {})).toEqual({ items: [], page: 1, pageSize: 20, total: 0 });
});

it("[INT-07][AC-01][PRD] orders DST-gap shifts by instant and reflects fresh completion/undo rows", () => {
  const input = fixture();
  input.events = [
    event("gap", { starts_at: "2026-10-03T02:30:00+10:00" }),
    event("after", { starts_at: "2026-10-03T03:10:00+10:00" }),
  ];
  input.now = new Date("2026-10-04T03:30:00+11:00");
  input.overrides = [];
  input.completions = [];
  for (const status of [undefined, "overdue", "planned", "done"] as const) {
    expect(buildTaskLog(input, { status })).toEqual(
      queryTaskLog(buildOccurrences(input), { status }),
    );
  }
  const completed = {
    event_id: "gap",
    original_start: "2026-10-04T03:30:00+11:00",
    action: "done",
    actor_display_name: "Synthetic Carer",
    occurred_at: "2026-10-04T03:30:00+11:00",
    seq: 1,
  };
  input.completions = [completed];
  expect(buildTaskLog(input, { status: "done" })).toEqual(
    queryTaskLog(buildOccurrences(input), { status: "done" }),
  );
  expect(buildTaskLog(input, { status: "done" }).total).toBe(1);
  input.completions.push({ ...completed, seq: 2, action: "undone" });
  expect(buildTaskLog(input, { status: "done" }).total).toBe(0);
});
