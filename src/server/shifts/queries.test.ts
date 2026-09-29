// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MARGARET_CLIENT_ID } from "@/mocks/fixtures";
import { getCarerPatients, getCarerShifts, getCarerTodayShifts } from "@/server/shifts/queries";

/**
 * Contract tests for the carer's shifts today (CHG-025): Carer Home's
 * "Today's calendar" lists the carer's shifts, not the client's events.
 * "Today" is the reference day `getToday()` uses, Mon 30 Nov 2026 (FD-03).
 */

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("[CAR-UI-01][AC-01] getCarerTodayShifts", () => {
  it("[CAR-UI-01][AC-01] Aisha gets only today's Margaret shift, 08:00–12:00, with the client's full name", async () => {
    const rows = await getCarerTodayShifts("staff-aisha");

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      clientId: MARGARET_CLIENT_ID,
      clientName: "Margaret Doyle",
      start: "2026-11-30T08:00:00+11:00",
      end: "2026-11-30T12:00:00+11:00",
    });
  });

  it("[CAR-UI-01][AC-01] a shift on another day is not listed (Aisha's Tue 1 Dec shift)", async () => {
    const rows = await getCarerTodayShifts("staff-aisha");

    expect(rows.every((row) => row.start.startsWith("2026-11-30"))).toBe(true);
  });

  it("[CAR-UI-01][AC-01] another carer's shift is not listed; Sarah gets her own 13:00–17:00 shift", async () => {
    const aisha = await getCarerTodayShifts("staff-aisha");
    const sarah = await getCarerTodayShifts("staff-sarah");

    expect(aisha.some((row) => row.start === "2026-11-30T13:00:00+11:00")).toBe(false);
    expect(sarah).toHaveLength(1);
    expect(sarah[0]).toMatchObject({
      clientName: "Margaret Doyle",
      start: "2026-11-30T13:00:00+11:00",
      end: "2026-11-30T17:00:00+11:00",
    });
  });

  it("[CAR-UI-01][AC-01] rows are ordered by start instant", async () => {
    const rows = await getCarerTodayShifts("staff-aisha");
    const starts = rows.map((row) => Date.parse(row.start));

    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it("[CAR-UI-01][AC-07] an unknown carer has no shifts", async () => {
    await expect(getCarerTodayShifts("staff-nobody")).resolves.toEqual([]);
  });
});

describe("[CAR-UI-01][PRD] supabase mode", () => {
  it("[CAR-UI-01][PRD] getCarerTodayShifts throws the not-implemented error naming its domain and function", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");

    await expect(getCarerTodayShifts("staff-aisha")).rejects.toThrow(
      /shifts\.getCarerTodayShifts: DATA_SOURCE="supabase" is not implemented yet/,
    );
  });
});

/**
 * Contract tests for the carer's shifts over a range of Melbourne days
 * (CAR-UI-03, CHG-030): the Carer Calendar's week, day and month views.
 */
const AISHA_WEEK = { from: "2026-11-30", to: "2026-12-06" };

describe("[CAR-UI-03][AC-07] getCarerShifts", () => {
  it("[CAR-UI-03][AC-07] Aisha's week of 30 Nov gives her nine shifts, earliest first, with the client's full name", async () => {
    const rows = await getCarerShifts("staff-aisha", AISHA_WEEK);

    expect(rows.map(({ start, end, clientName }) => [start, end, clientName])).toEqual([
      ["2026-11-30T08:00:00+11:00", "2026-11-30T12:00:00+11:00", "Margaret Doyle"],
      ["2026-12-01T09:00:00+11:00", "2026-12-01T11:00:00+11:00", "Margaret Doyle"],
      ["2026-12-01T13:00:00+11:00", "2026-12-01T15:00:00+11:00", "Robert"],
      ["2026-12-02T09:00:00+11:00", "2026-12-02T11:00:00+11:00", "Elsie"],
      ["2026-12-02T13:00:00+11:00", "2026-12-02T17:00:00+11:00", "Margaret Doyle"],
      ["2026-12-03T09:00:00+11:00", "2026-12-03T11:00:00+11:00", "Frank"],
      ["2026-12-03T13:00:00+11:00", "2026-12-03T15:00:00+11:00", "Doris"],
      ["2026-12-04T09:00:00+11:00", "2026-12-04T11:00:00+11:00", "Harold"],
      ["2026-12-04T13:00:00+11:00", "2026-12-04T15:00:00+11:00", "Jean"],
    ]);
    expect(rows[0]).toMatchObject({ clientId: MARGARET_CLIENT_ID });
  });

  it("[CAR-UI-03][AC-07] another carer's shift is not listed; Sarah gets her own", async () => {
    const aisha = await getCarerShifts("staff-aisha", AISHA_WEEK);
    const sarah = await getCarerShifts("staff-sarah", AISHA_WEEK);

    expect(aisha.every((row) => row.carerId === "staff-aisha")).toBe(true);
    expect(sarah).toHaveLength(1);
    expect(sarah[0]).toMatchObject({ start: "2026-11-30T13:00:00+11:00", carerId: "staff-sarah" });
  });

  it("[CAR-UI-03][AC-07] a one-day range gives only that day's shifts (Tue 1 Dec)", async () => {
    const rows = await getCarerShifts("staff-aisha", { from: "2026-12-01", to: "2026-12-01" });

    expect(rows.map((row) => [row.start, row.clientName])).toEqual([
      ["2026-12-01T09:00:00+11:00", "Margaret Doyle"],
      ["2026-12-01T13:00:00+11:00", "Robert"],
    ]);
  });

  it("[CAR-UI-03][AC-07] an unknown carer has no shifts", async () => {
    await expect(getCarerShifts("staff-nobody", AISHA_WEEK)).resolves.toEqual([]);
  });

  it("[CAR-UI-03][AC-07] a range whose end is before its start rejects", async () => {
    await expect(
      getCarerShifts("staff-aisha", { from: "2026-12-06", to: "2026-11-30" }),
    ).rejects.toThrow();
  });

  it("[CAR-UI-03][PRD] supabase mode throws the not-implemented error naming its domain and function", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");

    await expect(getCarerShifts("staff-aisha", AISHA_WEEK)).rejects.toThrow(
      /shifts\.getCarerShifts: DATA_SOURCE="supabase" is not implemented yet/,
    );
  });
});

/**
 * CAR-UI-02 (FD-02, PD-041): the patients a carer can see are the clients they
 * have a shift with that hasn't ended, soonest shift first. `onShift` means a
 * shift is in progress at the reference now, Mon 30 Nov 2026 09:00.
 */
describe("[CAR-UI-02][AC-13] getCarerPatients", () => {
  it("[CAR-UI-02][AC-13] Aisha sees the design's 7 patients, in order, with age and suburb", async () => {
    const rows = await getCarerPatients("staff-aisha");

    expect(rows.map((row) => [row.firstName, row.age, row.suburb])).toEqual([
      ["Margaret", 78, "Preston VIC"],
      ["Robert", 82, "Reservoir VIC"],
      ["Elsie", 90, "Thornbury VIC"],
      ["Frank", 76, "Northcote VIC"],
      ["Doris", 85, "Preston VIC"],
      ["Harold", 79, "Coburg VIC"],
      ["Jean", 88, "Fairfield VIC"],
    ]);
    expect(rows[0]!.clientId).toBe(MARGARET_CLIENT_ID);
  });

  it("[CAR-UI-02][AC-13] Aisha is on shift with Margaret only", async () => {
    const rows = await getCarerPatients("staff-aisha");

    expect(rows.filter((row) => row.onShift).map((row) => row.firstName)).toEqual(["Margaret"]);
  });

  it("[CAR-UI-02][AC-13] an unknown carer gets no patients", async () => {
    expect(await getCarerPatients("staff-nobody")).toEqual([]);
  });

  it("[CAR-UI-02][AC-13] a carer whose only shift has ended gets no patients (Daniel)", async () => {
    expect(await getCarerPatients("staff-daniel")).toEqual([]);
  });

  it("[CAR-UI-02][AC-13] adding patients leaves Aisha's Carer Home unchanged: one shift today", async () => {
    expect(await getCarerTodayShifts("staff-aisha")).toHaveLength(1);
  });
});

/**
 * CAR-05: the Supabase branch of `getCarerShifts`. The database itself is
 * exercised in `tests/integration/carer-calendar-shifts.test.ts`; these run
 * with the Supabase client mocked.
 */
describe("[CAR-05] getCarerShifts against Supabase (client mocked)", () => {
  const rpc = vi.fn();
  const createClient = vi.fn(async () => ({ rpc }));

  beforeEach(() => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    vi.resetModules();
    rpc.mockReset();
    createClient.mockClear();
    vi.doMock("@/lib/supabase/server", () => ({ createClient }));
  });

  afterEach(() => {
    vi.doUnmock("@/lib/supabase/server");
  });

  it.each([
    ["to before from", { from: "2026-12-06", to: "2026-11-30" }],
    ["over-long", { from: "2026-01-01", to: "2027-12-31" }],
  ])("[CAR-05][AC-08] a %s range rejects before the database is called", async (_label, range) => {
    const { getCarerShifts: get } = await import("@/server/shifts/queries");

    await expect(get("staff-aisha", range)).rejects.toThrow();
    expect(createClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("[CAR-05][AC-08] the same ranges also reject in mock mode", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { getCarerShifts: get } = await import("@/server/shifts/queries");

    await expect(get("staff-aisha", { from: "2026-12-06", to: "2026-11-30" })).rejects.toThrow();
  });

  it("[CAR-05][AC-09] a database error throws a generic message with no client or carer name", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "Margaret Doyle secret" } });
    const { getCarerShifts: get } = await import("@/server/shifts/queries");

    const error = await get("staff-aisha", { from: "2026-11-30", to: "2026-12-06" }).catch(
      (thrown: Error) => thrown,
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("getCarerShifts: could not load shifts.");
  });

  it("[CAR-05][AC-01] rows map to CarerShiftRow with clientName and the Melbourne-day window", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          id: "s1",
          carer_id: "staff-aisha",
          client_id: "c1",
          starts_at: "2026-11-29T21:00:00+00:00",
          ends_at: "2026-11-30T01:00:00+00:00",
          client_first_name: "Margaret",
          client_last_name: "Doyle",
        },
      ],
      error: null,
    });
    const { getCarerShifts: get } = await import("@/server/shifts/queries");

    const rows = await get("staff-aisha", { from: "2026-11-30", to: "2026-12-06" });

    expect(rows).toEqual([
      expect.objectContaining({
        id: "s1",
        carerId: "staff-aisha",
        clientId: "c1",
        clientName: "Margaret Doyle",
        start: expect.stringContaining("2026-11-30T08:00"),
        end: expect.stringContaining("2026-11-30T12:00"),
      }),
    ]);
    // Melbourne midnight of 30 Nov (UTC+11) to Melbourne midnight after 6 Dec.
    expect(rpc).toHaveBeenCalledWith("get_carer_shifts", {
      p_carer_id: "staff-aisha",
      p_from: "2026-11-29T13:00:00.000Z",
      p_to: "2026-12-06T13:00:00.000Z",
    });
  });
});
