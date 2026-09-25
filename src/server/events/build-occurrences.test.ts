// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  buildOccurrences,
  type CompletionRow,
  type EventRow,
  type OverrideRow,
  type ShiftCarerRow,
} from "@/server/events/build-occurrences";
import { AnyOccurrenceSchema, isPlainEvent } from "@/types/domain";

/*
 * F0-11: rows in, occurrences out (AC-01, AC-02, AC-03, AC-08), with no database. `now` is passed in,
 * so every status is exact. The real database is covered in tests/integration/care-events.test.ts.
 */
const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";
const WEEKLY_ID = "e1111111-1111-1111-1111-111111111111";
const WALK_ID = "e2222222-2222-2222-2222-222222222222";

/** Monday 30 November 2026, 09:00 in Melbourne (AEDT, +11:00). */
const MONDAY_9AM = "2026-11-29T22:00:00+00:00";

const LONG_BEFORE = new Date("2026-09-25T00:00:00Z");
const RANGE_WEEK = { from: "2026-11-29T13:00:00Z", to: "2026-12-06T13:00:00Z" }; // Mon 30 Nov 00:00 to Mon 7 Dec 00:00
const RANGE_MONTH = { from: "2026-11-29T13:00:00Z", to: "2026-12-31T13:00:00Z" };

function event(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: WEEKLY_ID,
    client_id: CLIENT_ID,
    title: "Morning medication",
    description: "With food.",
    starts_at: MONDAY_9AM,
    duration_minutes: 15,
    recurrence: { frequency: "weekly", interval: 1 },
    recurrence_until: null,
    completion_mode: "manual",
    is_active: true,
    deactivated_at: null,
    created_at: "2026-09-01T00:00:00+00:00",
    ...overrides,
  };
}

function plainWalk(overrides: Partial<EventRow> = {}): EventRow {
  return event({
    id: WALK_ID,
    title: "Afternoon walk",
    description: "",
    starts_at: "2026-11-30T03:00:00+00:00", // 14:00 Melbourne
    duration_minutes: 30,
    recurrence: { frequency: "daily", interval: 1 },
    completion_mode: "automatic",
    ...overrides,
  });
}

function done(overrides: Partial<CompletionRow> = {}): CompletionRow {
  return {
    event_id: WEEKLY_ID,
    original_start: MONDAY_9AM,
    action: "done",
    actor_display_name: "Aisha Rahman",
    occurred_at: "2026-11-29T22:12:00+00:00",
    seq: 1,
    ...overrides,
  };
}

function build(input: {
  events?: EventRow[];
  overrides?: OverrideRow[];
  completions?: CompletionRow[];
  shifts?: ShiftCarerRow[];
  range?: { from: string; to: string };
  now?: Date;
}) {
  return buildOccurrences({
    events: input.events ?? [event()],
    overrides: input.overrides ?? [],
    completions: input.completions ?? [],
    shifts: input.shifts ?? [],
    range: input.range ?? RANGE_WEEK,
    now: input.now ?? LONG_BEFORE,
  });
}

describe("[F0-11][AC-01] expanding an event into occurrences", () => {
  it("[F0-11][AC-01] a weekly 09:00 event has one occurrence in the week of 30 November, planned, with the event's details", () => {
    const [only, ...rest] = build({});

    expect(rest).toEqual([]);
    expect(only).toEqual({
      key: `${WEEKLY_ID}:2026-11-30T09:00:00+11:00`,
      eventId: WEEKLY_ID,
      clientId: CLIENT_ID,
      title: "Morning medication",
      description: "With food.",
      start: "2026-11-30T09:00:00+11:00",
      durationMinutes: 15,
      status: "planned",
    });
  });

  it("[F0-11][AC-01] over a month it returns each week's occurrence, oldest first", () => {
    const keys = build({ range: RANGE_MONTH }).map((occurrence) => occurrence.start);
    expect(keys).toEqual([
      "2026-11-30T09:00:00+11:00",
      "2026-12-07T09:00:00+11:00",
      "2026-12-14T09:00:00+11:00",
      "2026-12-21T09:00:00+11:00",
      "2026-12-28T09:00:00+11:00",
    ]);
  });

  it("[F0-11][AC-01] the end of the range is exclusive and the start is inclusive", () => {
    const at = { from: "2026-11-29T22:00:00Z", to: "2026-11-29T22:00:01Z" };
    expect(build({ range: at })).toHaveLength(1);
    const before = { from: "2026-11-29T21:00:00Z", to: "2026-11-29T22:00:00Z" };
    expect(build({ range: before })).toHaveLength(0);
  });

  it("[F0-11][AC-01] a fortnightly event (weekly, interval 2) skips the odd weeks", () => {
    const fortnightly = event({ recurrence: { frequency: "weekly", interval: 2 } });
    const starts = build({ events: [fortnightly], range: RANGE_MONTH }).map((o) => o.start);
    expect(starts).toEqual([
      "2026-11-30T09:00:00+11:00",
      "2026-12-14T09:00:00+11:00",
      "2026-12-28T09:00:00+11:00",
    ]);
  });

  it("[F0-11][AC-01] a one-off event appears only in a range that holds it", () => {
    const oneOff = event({ recurrence: null });
    expect(build({ events: [oneOff] }).map((o) => o.start)).toEqual(["2026-11-30T09:00:00+11:00"]);
    expect(
      build({
        events: [oneOff],
        range: { from: "2026-12-01T00:00:00Z", to: "2026-12-30T00:00:00Z" },
      }),
    ).toEqual([]);
  });

  it("[F0-11][AC-01] a series stops at its end date", () => {
    const ending = event({ recurrence_until: "2026-12-08" });
    expect(build({ events: [ending], range: RANGE_MONTH }).map((o) => o.start)).toEqual([
      "2026-11-30T09:00:00+11:00",
      "2026-12-07T09:00:00+11:00",
    ]);
  });

  it("[F0-11][AC-01] a 09:00 daily event stays at 09:00 across the clocks going back (+11:00 then +10:00)", () => {
    const daily = event({
      starts_at: "2026-04-03T22:00:00+00:00", // Sat 4 Apr 09:00 AEDT
      recurrence: { frequency: "daily", interval: 1 },
    });
    const range = { from: "2026-04-03T13:00:00Z", to: "2026-04-06T13:00:00Z" };
    expect(build({ events: [daily], range }).map((o) => o.start)).toEqual([
      "2026-04-04T09:00:00+11:00",
      "2026-04-05T09:00:00+10:00",
      "2026-04-06T09:00:00+10:00",
    ]);
  });

  it("[F0-11][AC-01] several events are merged, oldest first, ties by key", () => {
    const starts = build({ events: [plainWalk(), event()], range: RANGE_WEEK })
      .slice(0, 3)
      .map((o) => `${o.start} ${o.title}`);
    expect(starts).toEqual([
      "2026-11-30T09:00:00+11:00 Morning medication",
      "2026-11-30T14:00:00+11:00 Afternoon walk",
      "2026-12-01T14:00:00+11:00 Afternoon walk",
    ]);
  });

  it("[F0-11][AC-01] every occurrence it returns is valid against the domain schema", () => {
    for (const occurrence of build({ events: [event(), plainWalk()], range: RANGE_MONTH })) {
      expect(() => AnyOccurrenceSchema.parse(occurrence)).not.toThrow();
    }
  });

  it("[F0-11][AC-01] an event whose recurrence is not a valid rule throws, naming nothing about the client", () => {
    const broken = event({ recurrence: { frequency: "hourly", interval: 1 } });
    expect(() => build({ events: [broken] })).toThrow("care event has an invalid recurrence");
    expect(() => build({ events: [broken] })).not.toThrow(/Morning medication/);
  });
});

describe("[F0-11][AC-02][AC-03] status and who did it", () => {
  it("[F0-11][AC-02] with no completion, an occurrence in the past is overdue and one in the future is planned", () => {
    const now = new Date("2026-12-10T00:00:00Z");
    const statuses = build({ range: RANGE_MONTH, now }).map((o) => "status" in o && o.status);
    expect(statuses).toEqual(["overdue", "overdue", "planned", "planned", "planned"]);
  });

  it("[F0-11][AC-03] a done completion makes it Done with the actor and when", () => {
    const [occurrence] = build({ completions: [done()], now: new Date("2026-12-01T00:00:00Z") });
    expect(occurrence).toMatchObject({
      status: "done",
      actor: "Aisha Rahman",
      completedAt: "2026-11-29T22:12:00+00:00",
    });
  });

  it("[F0-11][AC-03] the completion is matched by instant, so the way the database writes it does not matter", () => {
    const [occurrence] = build({
      completions: [done({ original_start: "2026-11-30T09:00:00+11:00" })],
      now: new Date("2026-12-01T00:00:00Z"),
    });
    expect(occurrence).toMatchObject({ status: "done" });
  });

  it("[F0-11][AC-03] a completion for a different occurrence of the same event does not leak", () => {
    const [first, second] = build({
      range: RANGE_MONTH,
      completions: [done({ original_start: "2026-12-06T22:00:00+00:00" })],
      now: new Date("2026-12-01T00:00:00Z"),
    });
    expect(first).toMatchObject({ status: "overdue" });
    expect(second).toMatchObject({ status: "done" });
  });

  it("[F0-11][AC-03] a completion for a different event does not leak", () => {
    const [occurrence] = build({
      completions: [done({ event_id: WALK_ID })],
      now: new Date("2026-12-01T00:00:00Z"),
    });
    expect(occurrence).toMatchObject({ status: "overdue" });
  });

  it("[F0-11][AC-03] the latest completion by seq wins, whatever order the rows arrive in", () => {
    const rows = [
      done({ action: "undone", seq: 2, actor_display_name: "Helen Doyle" }),
      done({ action: "done", seq: 1 }),
      done({
        action: "done",
        seq: 3,
        actor_display_name: "Helen Doyle",
        occurred_at: "2026-11-30T00:00:00+00:00",
      }),
    ];
    const [occurrence] = build({ completions: rows, now: new Date("2026-12-01T00:00:00Z") });
    expect(occurrence).toMatchObject({ status: "done", actor: "Helen Doyle" });

    const [undone] = build({
      completions: rows.slice(0, 2),
      now: new Date("2026-12-01T00:00:00Z"),
    });
    expect(undone).toMatchObject({ status: "overdue" });
    expect(undone).not.toHaveProperty("actor");
  });
});

describe("[F0-11] plain events (CHG-009)", () => {
  it("[F0-11] a plain event's occurrence has kind 'event' and no status, actor or completion time", () => {
    const [walk] = build({ events: [plainWalk()], now: new Date("2027-01-01T00:00:00Z") });
    expect(walk).toMatchObject({ kind: "event", title: "Afternoon walk" });
    expect(isPlainEvent(walk!)).toBe(true);
    expect(walk).not.toHaveProperty("status");
    expect(walk).not.toHaveProperty("actor");
    expect(walk).not.toHaveProperty("completedAt");
  });

  it("[F0-11] an override can make one occurrence of a plain event a task, and of a task a plain event", () => {
    const overrides: OverrideRow[] = [
      {
        event_id: WALK_ID,
        original_start: "2026-11-30T03:00:00+00:00",
        kind: "modified",
        new_starts_at: null,
        new_duration_minutes: null,
        new_completion_mode: "manual",
      },
      {
        event_id: WEEKLY_ID,
        original_start: "2026-12-06T22:00:00+00:00",
        kind: "modified",
        new_starts_at: null,
        new_duration_minutes: null,
        new_completion_mode: "automatic",
      },
    ];
    const result = build({ events: [event(), plainWalk()], overrides, range: RANGE_MONTH });

    const monday = result.find(
      (o) => o.key.startsWith(WALK_ID) && o.start.startsWith("2026-11-30"),
    );
    const tuesday = result.find(
      (o) => o.key.startsWith(WALK_ID) && o.start.startsWith("2026-12-01"),
    );
    const dec7 = result.find(
      (o) => o.key.startsWith(WEEKLY_ID) && o.start.startsWith("2026-12-07"),
    );
    const nov30 = result.find(
      (o) => o.key.startsWith(WEEKLY_ID) && o.start.startsWith("2026-11-30"),
    );

    expect(monday).toMatchObject({ status: "planned" });
    expect(isPlainEvent(tuesday!)).toBe(true);
    expect(isPlainEvent(dec7!)).toBe(true);
    expect(nov30).toMatchObject({ status: "planned" });
  });

  it("[F0-11] an occurrence that was ticked off before its event became plain stays Done", () => {
    const [occurrence] = build({
      events: [plainWalk({ id: WEEKLY_ID, starts_at: MONDAY_9AM })],
      completions: [done()],
      now: new Date("2026-12-01T00:00:00Z"),
    });
    expect(occurrence).toMatchObject({ status: "done", actor: "Aisha Rahman" });
  });
});

describe("[F0-11] overrides", () => {
  it("[F0-11] a cancelled occurrence is not returned; the others are", () => {
    const overrides: OverrideRow[] = [
      {
        event_id: WEEKLY_ID,
        original_start: "2026-12-06T22:00:00+00:00",
        kind: "cancelled",
        new_starts_at: null,
        new_duration_minutes: null,
        new_completion_mode: null,
      },
    ];
    expect(build({ overrides, range: RANGE_MONTH }).map((o) => o.start.slice(0, 10))).toEqual([
      "2026-11-30",
      "2026-12-14",
      "2026-12-21",
      "2026-12-28",
    ]);
  });

  it("[F0-11] a modified occurrence moves and changes length, and keeps its original key", () => {
    const overrides: OverrideRow[] = [
      {
        event_id: WEEKLY_ID,
        original_start: MONDAY_9AM,
        kind: "modified",
        new_starts_at: "2026-11-30T03:30:00+00:00",
        new_duration_minutes: 45,
        new_completion_mode: null,
      },
    ];
    const [moved] = build({ overrides });
    expect(moved).toMatchObject({
      key: `${WEEKLY_ID}:2026-11-30T09:00:00+11:00`,
      start: "2026-11-30T14:30:00+11:00",
      durationMinutes: 45,
    });
  });

  it("[F0-11] a completion still belongs to its occurrence after the occurrence is moved", () => {
    const overrides: OverrideRow[] = [
      {
        event_id: WEEKLY_ID,
        original_start: MONDAY_9AM,
        kind: "modified",
        new_starts_at: "2026-11-30T03:30:00+00:00",
        new_duration_minutes: null,
        new_completion_mode: null,
      },
    ];
    const [moved] = build({
      overrides,
      completions: [done()],
      now: new Date("2026-12-01T00:00:00Z"),
    });
    expect(moved).toMatchObject({ status: "done", start: "2026-11-30T14:30:00+11:00" });
  });
});

describe("[F0-11][AC-08] a deactivated event", () => {
  it("[F0-11][AC-08] stops generating occurrences from the moment it was deactivated", () => {
    const stopped = event({ is_active: false, deactivated_at: "2026-12-01T00:00:00+00:00" });
    expect(
      build({ events: [stopped], range: RANGE_MONTH }).map((o) => o.start.slice(0, 10)),
    ).toEqual(["2026-11-30"]);
  });

  it("[F0-11][AC-08] returns none for next month, when asked about a month after it was deactivated", () => {
    const stopped = event({ is_active: false, deactivated_at: "2026-11-01T00:00:00+00:00" });
    expect(build({ events: [stopped], range: RANGE_MONTH })).toEqual([]);
  });

  it("[F0-11][AC-08] keeps its past occurrences, with their completions, for history", () => {
    const stopped = event({ is_active: false, deactivated_at: "2026-12-10T00:00:00+00:00" });
    const result = build({
      events: [stopped],
      range: RANGE_MONTH,
      completions: [done()],
      now: new Date("2026-12-31T00:00:00Z"),
    });
    expect(result.map((o) => o.start.slice(0, 10))).toEqual(["2026-11-30", "2026-12-07"]);
    expect(result[0]).toMatchObject({ status: "done", actor: "Aisha Rahman" });
  });

  it("[F0-11][AC-08] an inactive event with no recorded deactivation stops at its creation", () => {
    const stopped = event({
      is_active: false,
      deactivated_at: null,
      created_at: "2026-11-20T00:00:00+00:00",
    });
    expect(build({ events: [stopped], range: RANGE_MONTH })).toEqual([]);
  });

  it("[F0-11][AC-08] an active event ignores any old deactivated_at", () => {
    const back = event({ is_active: true, deactivated_at: "2026-11-01T00:00:00+00:00" });
    expect(build({ events: [back], range: RANGE_WEEK })).toHaveLength(1);
  });
});

describe("[F0-11] the assignee (OQ-29)", () => {
  const AISHA: ShiftCarerRow = {
    carer_display_name: "Aisha Rahman",
    starts_at: "2026-11-29T21:00:00+00:00", // 08:00 Melbourne
    ends_at: "2026-11-30T01:00:00+00:00", // 12:00 Melbourne
  };

  it("[F0-11] is the carer whose shift covers the occurrence's start", () => {
    const [occurrence] = build({ shifts: [AISHA] });
    expect(occurrence).toMatchObject({ assignee: "Aisha Rahman" });
  });

  it("[F0-11] is absent when no shift covers it", () => {
    const [occurrence] = build({
      shifts: [
        { ...AISHA, starts_at: "2026-11-30T05:00:00+00:00", ends_at: "2026-11-30T09:00:00+00:00" },
      ],
    });
    expect(occurrence).not.toHaveProperty("assignee");
  });

  it("[F0-11] a shift that ends exactly at the start does not cover it, one that starts exactly at it does", () => {
    const ends = { ...AISHA, starts_at: "2026-11-29T18:00:00+00:00", ends_at: MONDAY_9AM };
    expect(build({ shifts: [ends] })[0]).not.toHaveProperty("assignee");
    const starts = { ...AISHA, starts_at: MONDAY_9AM, ends_at: "2026-11-30T01:00:00+00:00" };
    expect(build({ shifts: [starts] })[0]).toMatchObject({ assignee: "Aisha Rahman" });
  });

  it("[F0-11] with two shifts covering it, the one that started first is shown", () => {
    const bea = { ...AISHA, carer_display_name: "Bea Ng", starts_at: "2026-11-29T21:30:00+00:00" };
    expect(build({ shifts: [bea, AISHA] })[0]).toMatchObject({ assignee: "Aisha Rahman" });
  });

  it("[F0-11] a plain event has an assignee too (PD-055)", () => {
    const [walk] = build({
      events: [plainWalk()],
      shifts: [
        {
          carer_display_name: "Bea Ng",
          starts_at: "2026-11-30T02:00:00+00:00",
          ends_at: "2026-11-30T06:00:00+00:00",
        },
      ],
    });
    expect(walk).toMatchObject({ kind: "event", assignee: "Bea Ng" });
  });
});
