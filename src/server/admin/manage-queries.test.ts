import { afterEach, expect, it, vi } from "vitest";

import { getAdminManage } from "./manage-queries";
afterEach(() => vi.unstubAllEnvs());
it("[ADM-UI-02][AC-01] returns the design staff and client lists", async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  const data = await getAdminManage();
  expect(data.staff.map((person) => person.name)).toEqual([
    "Aisha Rahman",
    "Daniel Kelly",
    "Sarah Nguyen",
    "Marcus Chen",
    "Fatima Ali",
  ]);
  expect(data.clients.map((person) => person.name)).toEqual([
    "Margaret Doyle",
    "Robert Hale",
    "Elsie Marsh",
    "Frank Novak",
    "Doris Petrov",
  ]);
});
it("[ADM-UI-02][AC-03] supplies the selected carer's 11:30 - 13:00 conflict", async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  const data = await getAdminManage();
  expect(data.shifts).toContainEqual(
    expect.objectContaining({
      staffId: "aisha",
      clientId: "margaret",
      date: "2026-11-30",
      start: "11:30",
      end: "13:00",
    }),
  );
});
it("[ADM-UI-02][AC-01] refuses to disguise Supabase mode as mock data", async () => {
  vi.stubEnv("DATA_SOURCE", "supabase");
  await expect(getAdminManage()).rejects.toThrow("not implemented");
});
