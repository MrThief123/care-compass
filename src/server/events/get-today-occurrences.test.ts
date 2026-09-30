// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * FAM-01 `getTodayOccurrences` under DATA_SOURCE=supabase with the Supabase client faked: which
 * window it reads (today, in Melbourne), what it returns, and how it fails. The real database is
 * covered in tests/integration/family-home-today.test.ts.
 */
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
/** 11:30 on Mon 30 Nov 2026 in Melbourne (AEDT, UTC+11). */
const NOW = new Date("2026-11-30T00:30:00Z");
/** Today's Melbourne day, as instants: the read window. */
const FROM = "2026-11-30T00:00:00+11:00";
const TO = "2026-12-01T00:00:00+11:00";

const MORNING_MEDS = {
  id: EVENT_ID,
  client_id: CLIENT_ID,
  title: "Morning medication",
  description: "",
  starts_at: "2026-11-29T22:00:00+00:00",
  duration_minutes: 60,
  recurrence: { frequency: "weekly", interval: 1 },
  recurrence_until: null,
  completion_mode: "manual",
  is_active: true,
  deactivated_at: null,
  created_at: "2026-09-01T00:00:00+00:00",
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.stubEnv("DATA_SOURCE", "supabase");
  for (const key of Object.keys(mocks.results)) delete mocks.results[key];
  mocks.calls.length = 0;
  mocks.results.care_events = { data: [MORNING_MEDS], error: null };
  mocks.results.care_event_overrides = { data: [], error: null };
  mocks.results.care_event_completions = { data: [], error: null };
  mocks.rpc.mockResolvedValue({ data: [], error: null });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

async function today() {
  const { getTodayOccurrences } = await import("@/server/events/queries");
  return getTodayOccurrences(CLIENT_ID);
}

describe("[FAM-01][AC-01] getTodayOccurrences reads today's Melbourne day from Supabase", () => {
  it("[FAM-01][AC-01] reads the events, overrides, completions and shifts for today's Melbourne day only", async () => {
    await today();

    expect(mocks.calls).toContainEqual({
      table: "care_events",
      method: "lt",
      args: ["starts_at", TO],
    });
    expect(mocks.calls).toContainEqual({
      table: "care_event_completions",
      method: "gte",
      args: ["original_start", FROM],
    });
    expect(mocks.rpc).toHaveBeenCalledWith("client_shift_carers", {
      p_client_id: CLIENT_ID,
      p_from: FROM,
      p_to: TO,
    });
  });

  it("[FAM-01][AC-01] returns today's occurrence done by the carer who did it, assigned to the carer on shift", async () => {
    mocks.results.care_event_completions = {
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
    };
    mocks.rpc.mockResolvedValue({
      data: [
        {
          carer_display_name: "Aisha Rahman",
          starts_at: "2026-11-29T21:00:00+00:00",
          ends_at: "2026-11-30T01:00:00+00:00",
        },
      ],
      error: null,
    });

    const rows = await today();

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      title: "Morning medication",
      start: "2026-11-30T09:00:00+11:00",
      durationMinutes: 60,
      status: "done",
      actor: "Aisha Rahman",
      assignee: "Aisha Rahman",
    });
  });

  it("[FAM-01][AC-02] an occurrence no shift covers has no assignee and reads Planned before it is due", async () => {
    vi.setSystemTime(new Date("2026-11-29T20:00:00Z"));
    const rows = await today();
    // 07:00 Melbourne on the 30th: the 09:00 occurrence is not due yet.
    expect(rows[0]).toMatchObject({ status: "planned" });
    expect(rows[0]).not.toHaveProperty("assignee");
  });

  it("[FAM-01][AC-04] a day with nothing on it is an empty list", async () => {
    mocks.results.care_events = { data: [], error: null };
    await expect(today()).resolves.toEqual([]);
  });
});

describe("[FAM-01][AC-06] getTodayOccurrences fails loudly, without client data", () => {
  it("[FAM-01][AC-06] rejects with a generic error when a read fails", async () => {
    mocks.results.care_events = { data: null, error: { message: "Margaret Doyle row 42" } };

    const failure = await today().then(
      () => undefined,
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).not.toContain("Margaret");
    expect((failure as Error).message).not.toContain("not implemented");
  });
});
