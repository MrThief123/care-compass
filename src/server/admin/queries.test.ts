import { afterEach, describe, expect, it, vi } from "vitest";

import { getAdminHome } from "./queries";

afterEach(() => vi.unstubAllEnvs());

describe("Admin Home query", () => {
  it("[ADM-UI-01][AC-01] returns the design totals through the mock adapter", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    expect(await getAdminHome()).toMatchObject({ clientCount: 42, staffCount: 17 });
  });
  it("[ADM-UI-01][AC-02] supplies all four design rows including Robert", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const data = await getAdminHome();
    expect(data.overdue).toHaveLength(4);
    expect(data.overdue).toContainEqual(
      expect.objectContaining({
        clientName: "Robert",
        eventTitle: "Medication review",
        nurseName: "Daniel K.",
      }),
    );
  });
  it("[ADM-UI-01][AC-01] does not silently serve mock totals in Supabase mode", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");
    await expect(getAdminHome()).rejects.toThrow("not implemented");
  });
});
