// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * [FAM-11][AC-10][AC-11] `settleEndedEventCosts` with the Supabase client and the occurrence read faked:
 * which occurrences it hands to `charge_ended_event_occurrences`. The real charging is in
 * supabase/tests/budget_event_charge.test.sql.
 */
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  events: vi.fn(),
  getOccurrences: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: mocks.rpc,
    from: () => ({
      select: () => ({ eq: () => ({ not: async () => mocks.events() }) }),
    }),
  }),
}));
vi.mock("@/server/events/queries", () => ({ getOccurrences: mocks.getOccurrences }));

import { settleEndedEventCosts } from "./settle";

const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";
const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
const NOW = new Date("2026-10-02T05:00:00Z"); // 4pm Melbourne

function occurrence(startIso: string, durationMinutes = 60, eventId = EVENT_ID) {
  return {
    key: `${eventId}:${startIso}`,
    eventId,
    clientId: CLIENT_ID,
    title: "Physio",
    description: "",
    start: startIso,
    durationMinutes,
    kind: "event",
  };
}

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "supabase");
  mocks.rpc.mockResolvedValue({ data: 1, error: null });
  mocks.events.mockResolvedValue({
    data: [{ id: EVENT_ID, cost_set_at: "2026-10-01T00:00:00Z" }],
    error: null,
  });
  mocks.getOccurrences.mockResolvedValue([]);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("settleEndedEventCosts", () => {
  it("[FAM-11][AC-10] charges an occurrence that has ended, with its original start", async () => {
    mocks.getOccurrences.mockResolvedValue([occurrence("2026-10-02T02:00:00Z")]);
    const charged = await settleEndedEventCosts(CLIENT_ID, { now: NOW });
    expect(charged).toBe(1);
    expect(mocks.rpc).toHaveBeenCalledWith("charge_ended_event_occurrences", {
      p_client_id: CLIENT_ID,
      p_items: [{ event_id: EVENT_ID, original_start: "2026-10-02T02:00:00Z" }],
    });
    expect(mocks.getOccurrences).toHaveBeenCalledWith(
      CLIENT_ID,
      { from: "2026-10-01", to: "2026-10-02" },
      expect.objectContaining({ type: "events" }),
    );
  });

  it("[FAM-11][AC-11] leaves an occurrence that has not ended, or started before the cost was set", async () => {
    mocks.getOccurrences.mockResolvedValue([
      occurrence("2026-10-02T04:30:00Z"), // 3:30pm to 4:30pm: still going
      occurrence("2026-09-30T02:00:00Z"), // before cost_set_at
      occurrence("2026-10-02T02:00:00Z", 60, "e9999999-9999-9999-9999-999999999999"), // no cost
    ]);
    await settleEndedEventCosts(CLIENT_ID, { now: NOW });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("[FAM-11][AC-11] does nothing when no event has a cost", async () => {
    mocks.events.mockResolvedValue({ data: [], error: null });
    expect(await settleEndedEventCosts(CLIENT_ID, { now: NOW })).toBe(0);
    expect(mocks.getOccurrences).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("[FAM-11][AC-10] reads a long gap in windows of at most 42 days", async () => {
    mocks.events.mockResolvedValue({
      data: [{ id: EVENT_ID, cost_set_at: "2026-07-01T00:00:00Z" }],
      error: null,
    });
    await settleEndedEventCosts(CLIENT_ID, { now: NOW });
    const ranges = mocks.getOccurrences.mock.calls.map((c) => c[1]) as {
      from: string;
      to: string;
    }[];
    expect(ranges.length).toBeGreaterThan(1);
    expect(ranges[0]!.from).toBe("2026-07-01");
    expect(ranges.at(-1)!.to).toBe("2026-10-02");
    for (const r of ranges) {
      const days = (Date.parse(r.to) - Date.parse(r.from)) / 86_400_000 + 1;
      expect(days).toBeLessThanOrEqual(42);
    }
  });

  it("[FAM-11][AC-10] does nothing in mock mode", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    expect(await settleEndedEventCosts(CLIENT_ID, { now: NOW })).toBe(0);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("[FAM-11][AC-10] never throws: a failed charge returns 0 so the page still loads", async () => {
    mocks.getOccurrences.mockResolvedValue([occurrence("2026-10-02T02:00:00Z")]);
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "XX000", message: "boom" } });
    expect(await settleEndedEventCosts(CLIENT_ID, { now: NOW })).toBe(0);
  });
});
