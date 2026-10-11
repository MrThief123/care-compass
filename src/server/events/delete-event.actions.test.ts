// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * [FAM-18] `deleteEventOccurrence`, `createEvent` and `updateEvent` against a faked Supabase client
 * that records each write. The real RLS and recurrence are covered in
 * tests/integration/family-delete-event.test.ts.
 */
const mocks = vi.hoisted(() => ({
  calls: [] as { table: string; op: string; args: unknown[] }[],
  reads: new Map<string, unknown>(),
  failOn: undefined as { table: string; op: string; code: string } | undefined,
}));

vi.mock("@/lib/supabase/server", () => {
  function from(table: string) {
    const state = { op: "select" };
    const result = () => {
      if (mocks.failOn?.table === table && mocks.failOn.op === state.op) {
        return { data: null, error: { code: mocks.failOn.code } };
      }
      return { data: mocks.reads.get(`${table}:${state.op}`) ?? null, error: null };
    };
    const chain: Record<string, unknown> = {};
    for (const op of ["insert", "update", "upsert"]) {
      chain[op] = (...args: unknown[]) => {
        state.op = op;
        mocks.calls.push({ table, op, args });
        return chain;
      };
    }
    for (const name of ["select", "eq", "order", "limit"]) chain[name] = () => chain;
    chain.single = async () => result();
    chain.maybeSingle = async () =>
      state.op === "select" ? { data: mocks.reads.get(`${table}:select`) ?? null, error: null } : result();
    chain.then = (resolve: (value: unknown) => void) => resolve(result());
    return chain;
  }
  return { createClient: async () => ({ from, rpc: async () => ({ data: null, error: null }) }) };
});

import { createEvent, deleteEventOccurrence, updateEvent } from "./actions";

const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";
const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
// Wednesday 14 Oct 2026 09:00 Melbourne (UTC+11).
const OCCURRENCE = "2026-10-13T22:00:00.000Z";

const weekly = { frequency: "weekly", interval: 1 };

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "supabase");
  mocks.calls.length = 0;
  mocks.reads.clear();
  mocks.failOn = undefined;
  mocks.reads.set("care_events:select", {
    id: EVENT_ID,
    starts_at: "2026-10-06T22:00:00.000Z", // Wed 7 Oct 09:00
    recurrence: weekly,
    recurrence_until: null,
  });
  mocks.reads.set("care_event_completions:select", null);
});
afterEach(() => vi.unstubAllEnvs());

const input = {
  clientId: CLIENT_ID,
  eventId: EVENT_ID,
  occurrenceOriginalStart: OCCURRENCE,
};

describe("[FAM-18] deleteEventOccurrence", () => {
  it("[FAM-18][AC-04] 'occurrence' writes a cancelled override for that occurrence", async () => {
    const result = await deleteEventOccurrence({ ...input, scope: "occurrence" });
    expect(result).toEqual({ ok: true, data: undefined });
    const write = mocks.calls.find((call) => call.table === "care_event_overrides");
    expect(write?.op).toBe("upsert");
    expect(write?.args[0]).toEqual({
      event_id: EVENT_ID,
      client_id: CLIENT_ID,
      original_start: OCCURRENCE,
      kind: "cancelled",
      new_starts_at: null,
      new_duration_minutes: null,
      new_completion_mode: null,
    });
    expect(write?.args[1]).toEqual({ onConflict: "event_id,original_start" });
  });

  it("[FAM-18][AC-05] 'future' ends the series the Melbourne day before the occurrence", async () => {
    const result = await deleteEventOccurrence({ ...input, scope: "future" });
    expect(result.ok).toBe(true);
    const write = mocks.calls.find((call) => call.table === "care_events");
    expect(write?.op).toBe("update");
    expect(write?.args[0]).toEqual({ recurrence_until: "2026-10-13" });
  });

  it("[FAM-18][AC-06] 'future' from the first occurrence ends the series before it started", async () => {
    const first = "2026-10-06T22:00:00.000Z";
    await deleteEventOccurrence({ ...input, occurrenceOriginalStart: first, scope: "future" });
    const write = mocks.calls.find((call) => call.table === "care_events");
    expect(write?.args[0]).toEqual({ recurrence_until: "2026-10-06" });
  });

  it("[FAM-18][AC-05] 'future' never lengthens an earlier end date", async () => {
    mocks.reads.set("care_events:select", {
      id: EVENT_ID,
      starts_at: "2026-10-06T22:00:00.000Z",
      recurrence: weekly,
      recurrence_until: "2026-10-10",
    });
    await deleteEventOccurrence({ ...input, scope: "future" });
    const write = mocks.calls.find((call) => call.table === "care_events");
    expect(write?.args[0]).toEqual({ recurrence_until: "2026-10-10" });
  });

  it("[FAM-18][AC-02] a one-off is cancelled as an occurrence whatever the scope", async () => {
    mocks.reads.set("care_events:select", {
      id: EVENT_ID,
      starts_at: OCCURRENCE,
      recurrence: null,
      recurrence_until: null,
    });
    await deleteEventOccurrence({ ...input, scope: "future" });
    expect(mocks.calls.map((call) => call.table)).toEqual(["care_event_overrides"]);
  });

  it("[FAM-18][AC-08] refuses a Done occurrence and writes nothing", async () => {
    mocks.reads.set("care_event_completions:select", { action: "done" });
    const result = await deleteEventOccurrence({ ...input, scope: "occurrence" });
    expect(result).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(mocks.calls).toHaveLength(0);
  });

  it("[FAM-18][AC-10] an event the caller cannot see is NOT_ALLOWED and writes nothing", async () => {
    mocks.reads.set("care_events:select", null);
    const result = await deleteEventOccurrence({ ...input, scope: "occurrence" });
    expect(result).toMatchObject({ ok: false, error: { code: "NOT_ALLOWED" } });
    expect(mocks.calls).toHaveLength(0);
  });

  it("[FAM-18][AC-09] a database refusal (shift ended) is NOT_ALLOWED", async () => {
    mocks.failOn = { table: "care_event_overrides", op: "upsert", code: "42501" };
    const result = await deleteEventOccurrence({ ...input, scope: "occurrence" });
    expect(result).toMatchObject({ ok: false, error: { code: "NOT_ALLOWED" } });
  });

  it("[FAM-18][AC-11] any other failure is the generic message", async () => {
    mocks.failOn = { table: "care_event_overrides", op: "upsert", code: "XX000" };
    const result = await deleteEventOccurrence({ ...input, scope: "occurrence" });
    expect(result).toEqual({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't delete. Please try again." },
    });
  });

  it("[FAM-18] rejects a malformed input", async () => {
    const result = await deleteEventOccurrence({ ...input, eventId: "", scope: "occurrence" });
    expect(result).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
  });
});

describe("[FAM-18] the end date on createEvent and updateEvent", () => {
  const base = {
    clientId: CLIENT_ID,
    title: "Physio",
    description: "",
    date: "2026-10-07",
    startTime: "09:00",
    durationMinutes: 60,
    recurrence: "weekly" as const,
    isTask: true,
  };

  it("[FAM-18][AC-13] createEvent saves endDate as recurrence_until", async () => {
    mocks.reads.set("care_events:insert", { id: EVENT_ID });
    await createEvent({ ...base, endDate: "2026-10-21" });
    const write = mocks.calls.find((call) => call.op === "insert");
    expect(write?.args[0]).toMatchObject({ recurrence_until: "2026-10-21" });
  });

  it("[FAM-18][AC-12] createEvent without endDate, or for a one-off, saves null", async () => {
    mocks.reads.set("care_events:insert", { id: EVENT_ID });
    await createEvent(base);
    await createEvent({ ...base, recurrence: "none", endDate: "2026-10-21" });
    const writes = mocks.calls.filter((call) => call.op === "insert");
    expect(writes[0]?.args[0]).toMatchObject({ recurrence_until: null });
    expect(writes[1]?.args[0]).toMatchObject({ recurrence_until: null });
  });

  it("[FAM-18][AC-14] an end date before the start date is a validation error and writes nothing", async () => {
    const result = await createEvent({ ...base, endDate: "2026-10-01" });
    expect(result).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(mocks.calls).toHaveLength(0);
  });

  it("[FAM-18][AC-15] updateEvent sets, clears and leaves endDate", async () => {
    mocks.reads.set("care_events:update", { id: EVENT_ID });
    const edit = {
      ...base,
      eventId: EVENT_ID,
      occurrenceOriginalStart: OCCURRENCE,
      scope: "occurrence" as const,
    };
    await updateEvent({ ...edit, endDate: "2026-12-01" });
    await updateEvent({ ...edit, endDate: null });
    await updateEvent(edit);
    const updates = mocks.calls
      .filter((call) => call.table === "care_events" && call.op === "update")
      .map((call) => call.args[0] as Record<string, unknown>);
    expect(updates[0]).toMatchObject({ recurrence_until: "2026-12-01" });
    expect(updates[1]).toMatchObject({ recurrence_until: null });
    expect(updates[2]).not.toHaveProperty("recurrence_until");
  });
});
