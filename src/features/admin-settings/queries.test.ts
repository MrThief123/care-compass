import { afterEach, expect, it, vi } from "vitest";

import { getAdminSettings } from "@/server/admin/settings-queries";
afterEach(() => vi.unstubAllEnvs());
it("[ADM-UI-05][AC-01] returns independent synthetic settings", async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  const first = await getAdminSettings();
  expect(first.organisation?.name).toBe("Banksia Home Care");
  if (!first.organisation) throw new Error("Expected fixture organisation");
  first.organisation.name = "Changed";
  expect((await getAdminSettings()).organisation?.name).toBe("Banksia Home Care");
});
it("[ADM-UI-05][AC-01] rejects unwired live mode", async () => {
  vi.stubEnv("DATA_SOURCE", "supabase");
  await expect(getAdminSettings()).rejects.toThrow("not implemented");
});
