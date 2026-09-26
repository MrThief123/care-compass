// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MARGARET_CLIENT_ID } from "@/mocks/fixtures";
import { getCarerTodayShifts } from "@/server/shifts/queries";

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
  it("[CAR-UI-01][AC-01] Aisha gets only today's Margaret shift, 08:00–12:00, with the client's first name", async () => {
    const rows = await getCarerTodayShifts("staff-aisha");

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      clientId: MARGARET_CLIENT_ID,
      clientFirstName: "Margaret",
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
      clientFirstName: "Margaret",
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
