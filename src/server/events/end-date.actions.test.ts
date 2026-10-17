// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * [FAM-18] the end date on `createEvent` and `updateEvent` against a faked Supabase client that
 * records each write. Delete is F0-27's `deleteEvent` (delete-actions.test.ts). The real RLS and recurrence are covered in
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
      state.op === "select"
        ? { data: mocks.reads.get(`${table}:select`) ?? null, error: null }
        : result();
    chain.then = (resolve: (value: unknown) => void) => resolve(result());
    return chain;
  }
  return { createClient: async () => ({ from, rpc: async () => ({ data: null, error: null }) }) };
});

import { createEvent, updateEvent } from "./actions";

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
