import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cancelShift, updateShift } from "@/server/admin/manage-actions";

/*
 * ADM-09 updateShift / cancelShift in mock mode (what `DATA_SOURCE=mock` serves, ADM-07 FD-08):
 * validation at the trust boundary and the result shapes, persisting nothing. Fixture "shift-30" is
 * Aisha with Margaret, 2026-11-30, 11:30-13:00 (src/mocks/admin-manage.ts). The database behaviour
 * is covered in tests/integration/admin-edit-shift.test.ts.
 */
beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

const VALID = { shiftId: "shift-30", carerId: "aisha", start: "11:30", end: "15:00" };

describe("[ADM-09][AC-06] updateShift (mock mode)", () => {
  it("[ADM-09][AC-06] returns the shift with the new times on its own date and client", async () => {
    expect(await updateShift(VALID)).toEqual({
      ok: true,
      data: {
        id: "shift-30",
        staffId: "aisha",
        clientId: "margaret",
        date: "2026-11-30",
        start: "11:30",
        end: "15:00",
      },
    });
  });

  it("[ADM-09][AC-06] a different carer is carried through", async () => {
    const result = await updateShift({ ...VALID, carerId: "daniel" });
    expect(result).toMatchObject({ ok: true, data: { id: "shift-30", staffId: "daniel" } });
  });

  it("[ADM-09][AC-06] persists nothing: a second call starts from the fixture again", async () => {
    await updateShift(VALID);
    const again = await updateShift({ ...VALID, end: "12:00" });
    expect(again).toMatchObject({ ok: true, data: { start: "11:30", end: "12:00" } });
  });

  it("[ADM-09][AC-06] an end not after the start is VALIDATION with the shared message on end", async () => {
    const result = await updateShift({ ...VALID, start: "12:00", end: "10:00" });
    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Check the shift time.",
        fieldErrors: { end: "End time must be after start time." },
      },
    });
  });

  it("[ADM-09][AC-06] a malformed time is VALIDATION on that field", async () => {
    const result = await updateShift({ ...VALID, start: "7am" });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "VALIDATION", fieldErrors: { start: "Enter a time as HH:MM." } },
    });
  });

  it("[ADM-09][AC-06] a blank shift id or carer is VALIDATION", async () => {
    expect(await updateShift({ ...VALID, shiftId: " " })).toMatchObject({
      ok: false,
      error: { code: "VALIDATION" },
    });
    expect(await updateShift({ ...VALID, carerId: "" })).toMatchObject({
      ok: false,
      error: { code: "VALIDATION", fieldErrors: { carerId: "Choose a staff member." } },
    });
  });

  it("[ADM-09][AC-06] an unknown shift is NOT_FOUND", async () => {
    expect(await updateShift({ ...VALID, shiftId: "no-such-shift" })).toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: "That shift can't be changed." },
    });
  });
});

describe("[ADM-09][AC-06] cancelShift (mock mode)", () => {
  it("[ADM-09][AC-06] returns the cancelled shift's id", async () => {
    expect(await cancelShift("shift-30")).toEqual({ ok: true, data: { id: "shift-30" } });
  });

  it("[ADM-09][AC-06] a blank id is VALIDATION and an unknown id is NOT_FOUND", async () => {
    expect(await cancelShift("  ")).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(await cancelShift("no-such-shift")).toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: "That shift can't be changed." },
    });
  });
});
