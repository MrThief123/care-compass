import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createStaff, deactivateStaff } from "@/server/admin/staff-actions";
import { getAdminStaff } from "@/server/admin/staff-queries";

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("[ADM-03][AC-09] deactivateStaff (mock mode)", () => {
  it("[ADM-03][AC-09] marks the carer inactive, and getAdminStaff then reports isActive false", async () => {
    const created = await createStaff({
      firstName: "Owen",
      lastName: "Hart",
      phone: "0400 111 222",
      email: "owen.hart@example.test",
      jobTitle: "Support Worker",
    });
    if (!created.ok) throw new Error("expected ok");

    const result = await deactivateStaff(created.data.id);

    expect(result).toEqual({ ok: true, data: { ...created.data, isActive: false } });
    const { staff } = await getAdminStaff();
    expect(staff.find((person) => person.id === created.data.id)).toMatchObject({
      firstName: "Owen",
      isActive: false,
    });
    // Kept, not deleted: the row is still in the list, with its details.
    expect(staff.filter((person) => person.id === created.data.id)).toHaveLength(1);
  });

  it("[ADM-03][AC-09] leaves every other carer active", async () => {
    const { staff: before } = await getAdminStaff();
    const target = before.find((person) => person.isActive);
    if (!target) throw new Error("expected an active carer in the mock store");

    await deactivateStaff(target.id);

    const { staff } = await getAdminStaff();
    expect(staff.filter((person) => person.id !== target.id)).toEqual(
      before.filter((person) => person.id !== target.id),
    );
  });

  it("[ADM-03][AC-05] deactivating an inactive carer again succeeds", async () => {
    const { staff } = await getAdminStaff();
    const target = staff.find((person) => person.isActive);
    if (!target) throw new Error("expected an active carer in the mock store");
    await deactivateStaff(target.id);

    const again = await deactivateStaff(target.id);

    expect(again).toMatchObject({ ok: true, data: { id: target.id, isActive: false } });
  });

  it("[ADM-03][AC-09] rejects a blank id with VALIDATION", async () => {
    expect(await deactivateStaff("  ")).toMatchObject({
      ok: false,
      error: { code: "VALIDATION" },
    });
  });

  it("[ADM-03][AC-09] returns NOT_FOUND for an unknown carer", async () => {
    expect(await deactivateStaff("staff-does-not-exist")).toMatchObject({
      ok: false,
      error: { code: "NOT_FOUND" },
    });
  });
});
