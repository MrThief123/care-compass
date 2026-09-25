// @vitest-environment node
import { describe, expect, expectTypeOf, it } from "vitest";

import {
  AnyOccurrenceSchema,
  FundEntrySchema,
  isPlainEvent,
  OccurrenceSchema,
  PlainEventOccurrenceSchema,
  TaskLogQuerySchema,
  type AnyOccurrence,
  type Occurrence,
  type OccurrenceStatus,
  type PlainEventOccurrence,
  type TaskLogResult,
} from "./domain";

const base = {
  key: "event-margaret-walk:2026-11-30T14:00:00+11:00",
  eventId: "event-margaret-walk",
  clientId: "client-margaret",
  title: "Afternoon walk",
  description: "",
  start: "2026-11-30T14:00:00+11:00",
  durationMinutes: 45,
};

const task = { ...base, status: "done", actor: "Aisha Rahman", completedAt: base.start };
const plainEvent = { ...base, kind: "event", assignee: "Aisha Rahman" };

describe("occurrence kinds", () => {
  it("[UI-05][AC-01] a task occurrence requires a known status", () => {
    expect(OccurrenceSchema.safeParse(task).success).toBe(true);
    expect(OccurrenceSchema.safeParse({ ...task, kind: "task" }).success).toBe(true);
    expect(OccurrenceSchema.safeParse(base).success).toBe(false);
    expect(OccurrenceSchema.safeParse({ ...task, status: "skipped" }).success).toBe(false);
    expect(OccurrenceSchema.safeParse({ ...task, kind: "event" }).success).toBe(false);
  });

  it("[UI-05][AC-01] a plain-event occurrence parses with no status, actor or completion time", () => {
    expect(PlainEventOccurrenceSchema.safeParse(plainEvent).success).toBe(true);
    expect(PlainEventOccurrenceSchema.safeParse({ ...base, kind: "event" }).success).toBe(true);
  });

  it("[UI-05][AC-01] a plain-event occurrence carrying a status, actor or completion time is rejected", () => {
    for (const extra of [
      { status: "planned" },
      { actor: "Aisha Rahman" },
      { completedAt: base.start },
    ]) {
      expect(PlainEventOccurrenceSchema.safeParse({ ...plainEvent, ...extra }).success).toBe(false);
      expect(AnyOccurrenceSchema.safeParse({ ...plainEvent, ...extra }).success).toBe(false);
    }
  });

  it("[UI-05][AC-01] AnyOccurrenceSchema accepts both kinds", () => {
    expect(AnyOccurrenceSchema.safeParse(task).success).toBe(true);
    expect(AnyOccurrenceSchema.safeParse(plainEvent).success).toBe(true);
    expect(AnyOccurrenceSchema.safeParse(base).success).toBe(false);
  });

  it("[UI-05][AC-01] isPlainEvent tells the kinds apart and narrows", () => {
    const parsedTask: AnyOccurrence = AnyOccurrenceSchema.parse(task);
    const parsedEvent: AnyOccurrence = AnyOccurrenceSchema.parse(plainEvent);
    expect(isPlainEvent(parsedTask)).toBe(false);
    expect(isPlainEvent(parsedEvent)).toBe(true);

    const occurrence = parsedEvent as AnyOccurrence;
    if (isPlainEvent(occurrence)) {
      expectTypeOf(occurrence).toEqualTypeOf<PlainEventOccurrence>();
    } else {
      expectTypeOf(occurrence).toEqualTypeOf<Occurrence>();
      expectTypeOf(occurrence.status).toEqualTypeOf<OccurrenceStatus>();
    }
  });

  it("[UI-05][AC-06] existing Occurrence and TaskLogResult types are unchanged for callers", () => {
    expectTypeOf<Occurrence["status"]>().toEqualTypeOf<OccurrenceStatus>();
    expectTypeOf<TaskLogResult["items"]>().toEqualTypeOf<Occurrence[]>();
    expectTypeOf<TaskLogResult<AnyOccurrence>["items"]>().toEqualTypeOf<AnyOccurrence[]>();
  });
});

describe("TaskLogQuerySchema type filter", () => {
  it("[UI-05][AC-02] accepts all, tasks, events and an omitted type", () => {
    for (const type of ["all", "tasks", "events"] as const) {
      expect(TaskLogQuerySchema.parse({ type })).toEqual({ type });
    }
    expect(TaskLogQuerySchema.parse({})).toEqual({});
    expect(TaskLogQuerySchema.parse({ type: "all", status: "done", q: "walk", page: 2 })).toEqual({
      type: "all",
      status: "done",
      q: "walk",
      page: 2,
    });
  });

  it("[UI-05][AC-02] rejects an unknown type as it rejects an unknown status", () => {
    expect(TaskLogQuerySchema.safeParse({ type: "bogus" }).success).toBe(false);
    expect(TaskLogQuerySchema.safeParse({ status: "bogus" }).success).toBe(false);
  });
});

describe("fund entries (CHG-022)", () => {
  const entry = {
    id: "fund-margaret-4",
    clientId: "client-margaret",
    bucketId: "bucket-margaret-government",
    type: "expense",
    amount: -310,
    date: "2026-10-27",
    description: "Physiotherapy",
    recordedBy: "Aisha Rahman",
  };

  it("[FAM-UI-05][AC-15] keeps a paid cost's date and a save's note, rather than stripping them", () => {
    const parsed = FundEntrySchema.parse({
      ...entry,
      paidOn: "2026-11-30",
      note: "Q3 plan review",
    });

    expect(parsed.paidOn).toBe("2026-11-30");
    expect(parsed.note).toBe("Q3 plan review");
  });

  it("[FAM-UI-05][AC-15] both are optional, so existing entries still parse", () => {
    expect(FundEntrySchema.safeParse(entry).success).toBe(true);
    expect(FundEntrySchema.safeParse({ ...entry, pending: true }).success).toBe(true);
  });

  it("[FAM-UI-05][AC-15] a paid date must be an ISO date", () => {
    expect(FundEntrySchema.safeParse({ ...entry, paidOn: "30 Nov 2026" }).success).toBe(false);
    expect(FundEntrySchema.safeParse({ ...entry, paidOn: "2026-11-30" }).success).toBe(true);
  });
});
