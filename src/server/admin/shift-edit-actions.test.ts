import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cancelShift } from "@/server/admin/manage-actions";

/*
 * ADM-09 cancelShift in mock mode (updateShift was dropped, CHG-053) (what `DATA_SOURCE=mock` serves, ADM-07 FD-08):
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
