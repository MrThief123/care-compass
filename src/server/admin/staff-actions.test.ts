import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createStaff, updateStaff } from "@/server/admin/staff-actions";
import { getAdminStaff } from "@/server/admin/staff-queries";

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("[ADM-02][AC-01] createStaff (mock mode)", () => {
  it("[ADM-02][AC-01] adds the new staff member, and getAdminStaff then includes it with its role", async () => {
    const result = await createStaff({
      firstName: "Priya",
      lastName: "Verma",
      phone: "0400 111 222",
      email: "priya.verma@example.test",
      jobTitle: "Enrolled Nurse",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.data).toMatchObject({
      firstName: "Priya",
      lastName: "Verma",
      jobTitle: "Enrolled Nurse",
      email: "priya.verma@example.test",
      isActive: true,
    });

    const { staff } = await getAdminStaff();
    expect(staff).toContainEqual(result.data);
  });

  it("[ADM-02][AC-02] rejects an empty email before touching the store", async () => {
    const before = await getAdminStaff();

    const result = await createStaff({
      firstName: "Nina",
      lastName: "Ray",
      phone: "",
      email: "",
      jobTitle: "Support Worker",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    const after = await getAdminStaff();
    expect(after.staff).toHaveLength(before.staff.length);
  });

  it("[ADM-02][AC-01] rejects a blank first name", async () => {
    const result = await createStaff({
      firstName: "  ",
      lastName: "Ray",
      phone: "",
      email: "nina.ray@example.test",
      jobTitle: "Support Worker",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
  });
});

describe("[ADM-02][AC-03] updateStaff (mock mode)", () => {
  it("[ADM-02][AC-03] updates an existing staff member's fields", async () => {
    const created = await createStaff({
      firstName: "Owen",
      lastName: "Park",
      phone: "0400 333 444",
      email: "owen.park@example.test",
      jobTitle: "Support Worker",
    });
    if (!created.ok) throw new Error("expected ok");

    const result = await updateStaff(created.data.id, {
      firstName: "Owen",
      lastName: "Park",
      phone: "0400 999 999",
      email: "owen.park2@example.test",
      jobTitle: "Registered Nurse",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.data).toMatchObject({
      phone: "0400 999 999",
      email: "owen.park2@example.test",
      jobTitle: "Registered Nurse",
    });

    const { staff } = await getAdminStaff();
    expect(staff.find((member) => member.id === created.data.id)).toMatchObject({
      jobTitle: "Registered Nurse",
    });
  });

  it("[ADM-02][PRD] NOT_FOUND for an id that does not exist", async () => {
    const result = await updateStaff("does-not-exist", {
      firstName: "X",
      lastName: "Y",
      phone: "",
      email: "x@example.test",
      jobTitle: "Support Worker",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });
});

describe("[CHG-038] staff phone must be an Australian number when filled in", () => {
  const staff = {
    firstName: "Nina",
    lastName: "Ray",
    email: "nina.ray@example.test",
    jobTitle: "Support Worker",
  };

  it("[CHG-038] createStaff and updateStaff refuse a bad phone before touching the store", async () => {
    const before = await getAdminStaff();

    const created = await createStaff({ ...staff, phone: "0395" });
    const updated = await updateStaff(before.staff[0]?.id ?? "", {
      ...staff,
      phone: "03 9555 O102",
    });

    expect(created).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(updated).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(await getAdminStaff()).toEqual(before);
  });

  it("[CHG-038] a blank phone is still allowed", async () => {
    expect((await createStaff({ ...staff, phone: "" })).ok).toBe(true);
  });
});
