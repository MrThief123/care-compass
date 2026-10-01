// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * ADM-07 assignShift with the Supabase client faked, so what is sent to the database can be checked
 * exactly. The real database (RLS, the org trigger) is covered in
 * tests/integration/admin-assign-shift.test.ts.
 */
const mocks = vi.hoisted(() => {
  const single = vi.fn();
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  const from = vi.fn(() => ({ insert }));
  const getUser = vi.fn();
  return { single, select, insert, from, getUser };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: mocks.from, auth: { getUser: mocks.getUser } }),
}));

const ADMIN_ID = "a2222222-2222-2222-2222-222222222222";
const VALID = {
  carerId: "a3333333-3333-3333-3333-333333333333",
  clientId: "b1111111-1111-1111-1111-111111111111",
  date: "2026-12-01",
  start: "07:00",
  end: "11:00",
};

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "supabase");
  mocks.getUser.mockResolvedValue({ data: { user: { id: ADMIN_ID } }, error: null });
  mocks.single.mockResolvedValue({
    data: {
      id: "c1111111-1111-1111-1111-111111111111",
      carer_id: VALID.carerId,
      client_id: VALID.clientId,
      starts_at: "2026-11-30T20:00:00+00:00",
      ends_at: "2026-12-01T00:00:00+00:00",
    },
    error: null,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("[ADM-07][AC-01] assignShift creates the shift", () => {
  it("[ADM-07][AC-01] 1 Dec 2026 07:00-11:00 Melbourne is stored as the right instants, created by the admin", async () => {
    const { assignShift } = await import("@/server/admin/manage-actions");

    const result = await assignShift(VALID);

    expect(mocks.from).toHaveBeenCalledWith("shifts");
    expect(mocks.insert).toHaveBeenCalledWith({
      carer_id: VALID.carerId,
      client_id: VALID.clientId,
      // AEDT (+11:00) on 1 Dec.
      starts_at: "2026-11-30T20:00:00.000Z",
      ends_at: "2026-12-01T00:00:00.000Z",
      created_by: ADMIN_ID,
    });
    expect(result).toEqual({
      ok: true,
      data: {
        id: "c1111111-1111-1111-1111-111111111111",
        staffId: VALID.carerId,
        clientId: VALID.clientId,
        date: "2026-12-01",
        start: "07:00",
        end: "11:00",
      },
    });
  });

  it("[ADM-07][AC-01] mock mode returns the shift without touching a database", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { assignShift } = await import("@/server/admin/manage-actions");

    const result = await assignShift({ ...VALID, carerId: "aisha", clientId: "margaret" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({
        staffId: "aisha",
        clientId: "margaret",
        date: "2026-12-01",
        start: "07:00",
        end: "11:00",
      });
    }
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe("[ADM-07][AC-03] assignShift validates on the server", () => {
  it("[ADM-07][AC-03] an end before the start is refused on the end field and nothing is inserted", async () => {
    const { assignShift } = await import("@/server/admin/manage-actions");

    const result = await assignShift({ ...VALID, start: "12:00", end: "10:00" });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Check the shift time.",
        fieldErrors: { end: "End time must be after start time." },
      },
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("[ADM-07][AC-03] a malformed date or time, or a missing carer or client, is refused", async () => {
    const { assignShift } = await import("@/server/admin/manage-actions");

    for (const input of [
      { ...VALID, date: "1 Dec" },
      { ...VALID, start: "7am" },
      { ...VALID, carerId: "" },
      { ...VALID, clientId: "" },
    ]) {
      const result = await assignShift(input);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("VALIDATION");
    }
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe("[ADM-07] assignShift permissions", () => {
  it("[ADM-07] a row-level security refusal is reported as not allowed, naming no one", async () => {
    mocks.single.mockResolvedValue({
      data: null,
      error: { code: "42501", message: 'new row violates row-level security policy for table "shifts"' },
    });
    const { assignShift } = await import("@/server/admin/manage-actions");

    const result = await assignShift(VALID);

    expect(result).toEqual({
      ok: false,
      error: { code: "UNAUTHORISED", message: "You can't assign this carer to this client." },
    });
  });

  it("[ADM-07] a carer from another organisation (the insert trigger) is reported as not allowed", async () => {
    mocks.single.mockResolvedValue({
      data: null,
      error: { code: "P0001", message: "carer must belong to the same organisation as the client" },
    });
    const { assignShift } = await import("@/server/admin/manage-actions");

    const result = await assignShift(VALID);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORISED");
  });

  it("[ADM-07] no signed-in user inserts nothing", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const { assignShift } = await import("@/server/admin/manage-actions");

    const result = await assignShift(VALID);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAUTHORISED");
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("[ADM-07] any other database failure is a generic retry message", async () => {
    mocks.single.mockResolvedValue({ data: null, error: { code: "08006", message: "boom" } });
    const { assignShift } = await import("@/server/admin/manage-actions");

    const result = await assignShift(VALID);

    expect(result).toEqual({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't assign the shift. Try again." },
    });
  });
});
