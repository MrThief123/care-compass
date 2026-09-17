import { afterEach, describe, expect, it, vi } from "vitest";

import { getBudgetSummary } from "@/server/budget/queries";
import { MARGARET_CLIENT_ID } from "@/mocks/fixtures";

describe("[UI-00][AC-04] getBudgetSummary via the mock data source", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns Margaret's NDIS / Fixed / Government buckets matching the design figures", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");

    const buckets = await getBudgetSummary(MARGARET_CLIENT_ID);

    const byKind = Object.fromEntries(buckets.map((b) => [b.kind, b]));

    expect(byKind.ndis).toMatchObject({
      total: 24000,
      remaining: 14880,
      percentUsed: 38,
    });
    expect(byKind.fixed).toMatchObject({
      total: 5000,
      remaining: 2750,
      percentUsed: 45,
    });
    expect(byKind.government).toMatchObject({
      total: 3000,
      remaining: 240,
      percentUsed: 92,
    });
  });
});
