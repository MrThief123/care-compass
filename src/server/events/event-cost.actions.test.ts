// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * [FAM-11][AC-09] `createEvent` and `updateEvent` save an event's cost and bucket through `set_event_cost`,
 * with the Supabase client faked. The real function is covered in supabase/tests/budget.test.sql.
 */
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn(), maybeSingle: vi.fn() }));

vi.mock("@/lib/supabase/server", () => {
  const chain: Record<string, unknown> = {};
  for (const name of ["insert", "update", "select", "eq", "upsert"]) {
    chain[name] = () => chain;
  }
  chain.single = mocks.single;
  chain.maybeSingle = mocks.maybeSingle;
  return { createClient: async () => ({ rpc: mocks.rpc, from: () => chain }) };
});

import { createEvent, updateEvent } from "./actions";

const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";
const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
const BUCKET_ID = "c0000000-0000-0000-0000-000000000001";

const base = {
  clientId: CLIENT_ID,
  title: "Physio",
  description: "",
  date: "2026-10-05",
  startTime: "10:00",
  durationMinutes: 60,
  recurrence: "none" as const,
  isTask: false,
};

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "supabase");
  mocks.single.mockResolvedValue({ data: { id: EVENT_ID }, error: null });
  mocks.maybeSingle.mockResolvedValue({
    data: { starts_at: "2026-10-05T00:00:00Z", recurrence: null },
    error: null,
  });
  mocks.rpc.mockResolvedValue({ data: null, error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("createEvent cost", () => {
  it("[FAM-11][AC-09] saves the cost and bucket after the event", async () => {
    const result = await createEvent({ ...base, cost: { amount: 90, bucketId: BUCKET_ID } });
    expect(result).toEqual({ ok: true, data: { eventId: EVENT_ID } });
    expect(mocks.rpc).toHaveBeenCalledWith("set_event_cost", {
      p_event_id: EVENT_ID,
      p_cost: 90,
      p_bucket_id: BUCKET_ID,
    });
  });

  it("[FAM-11][AC-09] calls nothing for an event with no cost", async () => {
    await createEvent(base);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("[FAM-11][AC-09] refuses a cost that is not above $0", async () => {
    const result = await createEvent({ ...base, cost: { amount: 0, bucketId: BUCKET_ID } });
    expect(result.ok).toBe(false);
    expect(mocks.single).not.toHaveBeenCalled();
  });

  it("[FAM-11][AC-09] says so when the event was saved but its cost was not", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "22023", message: "bad bucket" } });
    const result = await createEvent({ ...base, cost: { amount: 90, bucketId: BUCKET_ID } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/event was saved/i);
  });
});

describe("updateEvent cost", () => {
  const update = {
    ...base,
    eventId: EVENT_ID,
    occurrenceOriginalStart: "2026-10-05T00:00:00Z",
    scope: "series" as const,
  };

  it("[FAM-11][AC-09] saves a new cost and bucket", async () => {
    const result = await updateEvent({ ...update, cost: { amount: 45.5, bucketId: BUCKET_ID } });
    expect(result.ok).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("set_event_cost", {
      p_event_id: EVENT_ID,
      p_cost: 45.5,
      p_bucket_id: BUCKET_ID,
    });
  });

  it("[FAM-11][AC-09] clears both when the cost is null", async () => {
    await updateEvent({ ...update, cost: null });
    expect(mocks.rpc).toHaveBeenCalledWith("set_event_cost", {
      p_event_id: EVENT_ID,
      p_cost: null,
      p_bucket_id: null,
    });
  });

  it("[FAM-11][AC-09] leaves the cost alone when it is not passed", async () => {
    await updateEvent(update);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("[FAM-11][AC-09] maps a refused cost change to NOT_ALLOWED", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "no" } });
    const result = await updateEvent({ ...update, cost: { amount: 10, bucketId: BUCKET_ID } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_ALLOWED");
  });
});
