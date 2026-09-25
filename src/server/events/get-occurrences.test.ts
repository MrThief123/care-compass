// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import { isPlainEvent } from "@/types/domain";

/*
 * F0-11 `getOccurrences` with the Supabase client faked: which rows it asks for, what it does with
 * them, and how it fails. The real database is covered in tests/integration/care-events.test.ts and
 * the pure assembly in build-occurrences.test.ts.
 */
type Result = { data: unknown; error: unknown };
const mocks = vi.hoisted(() => {
  const calls: { table: string; method: string; args: unknown[] }[] = [];
  const results: Record<string, { data: unknown; error: unknown }> = {};
  const rpc = vi.fn();
  const from = vi.fn((table: string) => {
    const builder: Record<string, unknown> = {};
    for (const method of ["select", "eq", "lt", "gte", "order"]) {
      builder[method] = (...args: unknown[]) => {
        calls.push({ table, method, args });
        return builder;
      };
    }
    builder.then = (resolve: (value: unknown) => unknown) =>
      resolve(results[table] ?? { data: [], error: null });
    return builder;
  });
  return { calls, results, rpc, from };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: mocks.from, rpc: mocks.rpc }),
}));

const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";
const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
/** The contract's range: Melbourne calendar dates, both inclusive (CHG-012). */
const RANGE = { from: "2026-11-30", to: "2026-12-06" };
/** What the database is read over: from the start of `from` to the start of the day after `to`. */
const FROM = "2026-11-30T00:00:00+11:00";
const TO = "2026-12-07T00:00:00+11:00";
const NOW = new Date("2026-12-01T00:00:00Z");

const EVENT_ROW = {
  id: EVENT_ID,
  client_id: CLIENT_ID,
  title: "Morning medication",
  description: "",
  starts_at: "2026-11-29T22:00:00+00:00",
  duration_minutes: 15,
  recurrence: { frequency: "weekly", interval: 1 },
  recurrence_until: null,
  completion_mode: "manual",
  is_active: true,
  deactivated_at: null,
  created_at: "2026-09-01T00:00:00+00:00",
};

function setResult(table: string, result: Result) {
  mocks.results[table] = result;
}

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "supabase");
  for (const key of Object.keys(mocks.results)) delete mocks.results[key];
  mocks.calls.length = 0;
  setResult("care_events", { data: [EVENT_ROW], error: null });
  setResult("care_event_overrides", { data: [], error: null });
  setResult("care_event_completions", { data: [], error: null });
  mocks.rpc.mockResolvedValue({ data: [], error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

async function run(options: { type?: "all" | "tasks" | "events" } = {}) {
  const { getOccurrences } = await import("@/server/events/queries");
  return options.type
    ? getOccurrences(CLIENT_ID, RANGE, { now: NOW, type: options.type })
    : getOccurrences(CLIENT_ID, RANGE, { now: NOW });
}

describe("[F0-11][AC-01] getOccurrences reads and assembles", () => {
  it("[F0-11][AC-01] asks only for this client's events that begin before the range's last day ends", async () => {
    await run();

    const eventCalls = mocks.calls.filter((call) => call.table === "care_events");
    expect(eventCalls).toContainEqual({
      table: "care_events",
      method: "eq",
      args: ["client_id", CLIENT_ID],
    });
    expect(eventCalls).toContainEqual({
      table: "care_events",
      method: "lt",
      args: ["starts_at", TO],
    });
  });

  it("[F0-11][AC-01] asks for overrides and completions only for this client and the range's original starts", async () => {
    await run();

    for (const table of ["care_event_overrides", "care_event_completions"]) {
      const tableCalls = mocks.calls.filter((call) => call.table === table);
      expect(tableCalls).toContainEqual({ table, method: "eq", args: ["client_id", CLIENT_ID] });
      expect(tableCalls).toContainEqual({
        table,
        method: "gte",
        args: ["original_start", FROM],
      });
      expect(tableCalls).toContainEqual({
        table,
        method: "lt",
        args: ["original_start", TO],
      });
    }
  });

  it("[F0-11][AC-01] asks who is on shift for the same window (the range's days, in Melbourne time)", async () => {
    await run();
    expect(mocks.rpc).toHaveBeenCalledWith("client_shift_carers", {
      p_client_id: CLIENT_ID,
      p_from: FROM,
      p_to: TO,
    });
  });

  it("[F0-11][AC-01][AC-03] returns the assembled occurrences: status, actor and assignee from the rows", async () => {
    setResult("care_event_completions", {
      data: [
        {
          event_id: EVENT_ID,
          original_start: "2026-11-29T22:00:00+00:00",
          action: "done",
          actor_display_name: "Aisha Rahman",
          occurred_at: "2026-11-29T22:12:00+00:00",
          seq: 1,
        },
      ],
      error: null,
    });
    mocks.rpc.mockResolvedValue({
      data: [
        {
          shift_id: "s1",
          carer_id: "c1",
          carer_display_name: "Aisha Rahman",
          starts_at: "2026-11-29T21:00:00+00:00",
          ends_at: "2026-11-30T01:00:00+00:00",
        },
      ],
      error: null,
    });

    const occurrences = await run();

    expect(occurrences).toHaveLength(1);
    expect(occurrences[0]).toMatchObject({
      title: "Morning medication",
      status: "done",
      actor: "Aisha Rahman",
      assignee: "Aisha Rahman",
    });
  });

  it("[F0-11][AC-07] with no readable events it returns [] and does not ask who is on shift", async () => {
    setResult("care_events", { data: [], error: null });
    await expect(run()).resolves.toEqual([]);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe("[F0-11] the type option follows the events contract", () => {
  const WALK_ROW = {
    ...EVENT_ROW,
    id: "e2222222-2222-2222-2222-222222222222",
    title: "Walk",
    completion_mode: "automatic",
  };

  it("[F0-11] returns tasks only unless a type is passed", async () => {
    setResult("care_events", { data: [EVENT_ROW, WALK_ROW], error: null });
    const titles = (await run()).map((occurrence) => occurrence.title);
    expect(titles).toEqual(["Morning medication"]);
  });

  it("[F0-11] type 'all' includes plain events, and 'events' returns only them", async () => {
    setResult("care_events", { data: [EVENT_ROW, WALK_ROW], error: null });
    const titles = (await run({ type: "all" })).map((occurrence) => occurrence.title);
    expect(titles).toContain("Morning medication");
    expect(titles).toContain("Walk");
    const events = await run({ type: "events" });
    expect(events.length).toBeGreaterThan(0);
    expect(events.every(isPlainEvent)).toBe(true);
  });
});

describe("[F0-11] getOccurrences fails safely", () => {
  it.each(["care_events", "care_event_overrides", "care_event_completions"])(
    "[F0-11] an error reading %s throws a generic message that carries no data",
    async (table) => {
      setResult(table, { data: null, error: { code: "XX000", message: `boom for ${CLIENT_ID}` } });
      const rejection = run();
      await expect(rejection).rejects.toThrow("getOccurrences: could not load occurrences.");
      await expect(rejection).rejects.not.toThrow(CLIENT_ID);
    },
  );

  it("[F0-11] an error asking who is on shift throws the same generic message", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "42501", message: CLIENT_ID } });
    await expect(run()).rejects.toThrow("getOccurrences: could not load occurrences.");
  });

  it.each([
    ["a range that ends before it starts", { from: "2026-12-06", to: "2026-11-30" }],
    ["a range that is not a date", { from: "soon", to: "2026-12-06" }],
    ["a date that does not exist", { from: "2026-02-30", to: "2026-03-05" }],
    ["a range longer than the most a read may cover", { from: "2026-01-01", to: "2026-12-31" }],
  ])(
    "[F0-11] refuses %s (a ZodError, as the contract says) and reads nothing",
    async (_label, range) => {
      const { getOccurrences } = await import("@/server/events/queries");
      await expect(getOccurrences(CLIENT_ID, range, { now: NOW })).rejects.toThrow(ZodError);
      expect(mocks.from).not.toHaveBeenCalled();
    },
  );

  it("[F0-11] a one-day range is valid: `from` and `to` are both inclusive", async () => {
    const { getOccurrences } = await import("@/server/events/queries");
    await getOccurrences(CLIENT_ID, { from: "2026-11-30", to: "2026-11-30" }, { now: NOW });
    expect(mocks.calls).toContainEqual({
      table: "care_events",
      method: "lt",
      args: ["starts_at", "2026-12-01T00:00:00+11:00"],
    });
  });

  it("[F0-11] a client id that is not an id is an unknown client: an empty list, nothing read", async () => {
    const { getOccurrences } = await import("@/server/events/queries");
    await expect(getOccurrences("", RANGE, { now: NOW })).resolves.toEqual([]);
    await expect(getOccurrences("client-margaret", RANGE, { now: NOW })).resolves.toEqual([]);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe("[F0-11] getOccurrences on the mock data source", () => {
  it("[F0-11] still returns the design week as before, tasks only, and touches no database", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { getOccurrences } = await import("@/server/events/queries");

    const week = await getOccurrences("client-margaret", RANGE);

    expect(week.length).toBeGreaterThan(0);
    expect(week.every((occurrence) => !isPlainEvent(occurrence))).toBe(true);
    const starts = week.map((occurrence) => Date.parse(occurrence.start));
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("[F0-11] type 'all' adds the plain events, 'events' returns only them, and another client's never appear", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { getOccurrences } = await import("@/server/events/queries");

    const tasks = await getOccurrences("client-margaret", RANGE);
    const all = await getOccurrences("client-margaret", RANGE, { type: "all" });
    const events = await getOccurrences("client-margaret", RANGE, { type: "events" });

    expect(all.length).toBe(tasks.length + events.length);
    expect(events.length).toBeGreaterThan(0);
    expect(events.every(isPlainEvent)).toBe(true);
    expect(all.every((occurrence) => occurrence.clientId === "client-margaret")).toBe(true);
    expect(await getOccurrences("client-nobody", RANGE, { type: "all" })).toEqual([]);
  });
});
