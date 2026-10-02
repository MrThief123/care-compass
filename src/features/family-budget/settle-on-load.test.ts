import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * [FAM-11][AC-10] Budget and Family home settle the client's ended event costs before they read the buckets,
 * so the figures they show already include them.
 */
const calls = vi.hoisted(() => [] as string[]);

vi.mock("@/server/budget/settle", () => ({
  settleEndedEventCosts: vi.fn(async () => {
    calls.push("settle");
    return 0;
  }),
}));
vi.mock("@/server/budget/queries", () => ({
  getBudgetSummary: vi.fn(async () => {
    calls.push("summary");
    return [];
  }),
  getFundHistory: vi.fn(async () => []),
}));
vi.mock("@/server/events/queries", () => ({
  getToday: vi.fn(async () => "2026-10-02"),
  getTodayOccurrences: vi.fn(async () => []),
  getTaskLog: vi.fn(async () => ({ items: [], total: 0 })),
}));

import { loadFamilyBudgetData } from "@/features/family-budget/budget-data";
import { loadFamilyHomeData } from "@/features/family-home/home-data";

beforeEach(() => {
  calls.length = 0;
});

describe("[FAM-11][AC-10] ended event costs are settled before the figures are read", () => {
  it("[FAM-11][AC-10] Budget settles first", async () => {
    await loadFamilyBudgetData("client-1");
    expect(calls[0]).toBe("settle");
    expect(calls).toContain("summary");
  });

  it("[FAM-11][AC-10] Family home settles first", async () => {
    await loadFamilyHomeData("client-1");
    expect(calls[0]).toBe("settle");
    expect(calls).toContain("summary");
  });
});
