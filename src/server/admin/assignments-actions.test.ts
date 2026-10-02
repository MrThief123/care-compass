import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * ADM-08, mock data source: the assignments list and Remove behave like the real contract
 * (a removed pair drops out of the list; other pairs stay) without a database. The mock store is
 * module-scoped, so each test gets a fresh copy. The database behaviour is covered by
 * supabase/tests/admin_carer_assignments.test.sql and tests/integration/admin-carer-assignments.test.ts.
 */
async function load() {
  vi.resetModules();
  const queries = await import("@/server/admin/assignments-queries");
  const actions = await import("@/server/admin/assignments-actions");
  return { ...queries, ...actions };
}

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("[ADM-08][AC-04] getCarerAssignments (mock mode)", () => {
  it("[ADM-08][AC-04] lists each carer's clients by full name with their shift count and next shift", async () => {
    const { getCarerAssignments } = await load();
    const { assignments } = await getCarerAssignments();

    const aisha = assignments.filter((row) => row.carerId === "staff-aisha");
    expect(aisha.map((row) => row.clientName).sort()).toEqual(["Elsie Marsh", "Margaret Doyle"]);
    expect(aisha[0]).toEqual(
      expect.objectContaining({
        clientId: expect.any(String),
        shiftCount: expect.any(Number),
        nextShift: {
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          start: expect.stringMatching(/^\d{2}:\d{2}$/),
          end: expect.stringMatching(/^\d{2}:\d{2}$/),
        },
      }),
    );
  });
});

describe("[ADM-08][AC-02] removeCarerAssignment (mock mode)", () => {
  it("[ADM-08][AC-02] removes the pair from the list and leaves the carer's other clients and other carers alone", async () => {
    const { getCarerAssignments, removeCarerAssignment } = await load();
    const before = (await getCarerAssignments()).assignments;
    const elsie = before.find(
      (row) => row.carerId === "staff-aisha" && row.clientName === "Elsie Marsh",
    )!;

    const result = await removeCarerAssignment({
      carerId: "staff-aisha",
      clientId: elsie.clientId,
    });
    expect(result).toEqual({ ok: true, data: { endedShifts: elsie.shiftCount } });

    const after = (await getCarerAssignments()).assignments;
    expect(after).toHaveLength(before.length - 1);
    expect(
      after.find((row) => row.carerId === "staff-aisha" && row.clientId === elsie.clientId),
    ).toBeUndefined();
    expect(after.filter((row) => row.carerId === "staff-aisha")).toHaveLength(1);
    expect(after.filter((row) => row.carerId !== "staff-aisha")).toEqual(
      before.filter((row) => row.carerId !== "staff-aisha"),
    );
  });

  it("[ADM-08][AC-02] removing a pair that is already ended succeeds and changes nothing", async () => {
    const { getCarerAssignments, removeCarerAssignment } = await load();
    const first = (await getCarerAssignments()).assignments[0]!;
    await removeCarerAssignment({ carerId: first.carerId, clientId: first.clientId });
    const again = await removeCarerAssignment({ carerId: first.carerId, clientId: first.clientId });
    expect(again).toEqual({ ok: true, data: { endedShifts: 0 } });
  });

  it("[ADM-08][AC-06] rejects a missing carer or client before touching the store", async () => {
    const { getCarerAssignments, removeCarerAssignment } = await load();
    const before = await getCarerAssignments();

    expect(await removeCarerAssignment({ carerId: "", clientId: "margaret" })).toMatchObject({
      ok: false,
      error: { code: "VALIDATION" },
    });
    expect(await removeCarerAssignment({ carerId: "staff-aisha", clientId: "  " })).toMatchObject({
      ok: false,
      error: { code: "VALIDATION" },
    });
    expect(await getCarerAssignments()).toEqual(before);
  });
});
