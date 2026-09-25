import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BudgetBucketSummary, FundEntry } from "@/types/domain";

import { loadFamilyBudgetData } from "./budget-data";

const mocks = vi.hoisted(() => ({
  getBudgetSummary: vi.fn(),
  getFundHistory: vi.fn(),
  getClientHeaderSummary: vi.fn(),
  getToday: vi.fn(),
}));

vi.mock("@/server/budget/queries", () => ({
  getBudgetSummary: mocks.getBudgetSummary,
  getFundHistory: mocks.getFundHistory,
}));
vi.mock("@/server/events/queries", () => ({
  getToday: mocks.getToday,
}));
vi.mock("@/server/clients/queries", () => ({
  getClientHeaderSummary: mocks.getClientHeaderSummary,
}));

const CLIENT_ID = "client-margaret";

const BUCKET: BudgetBucketSummary = {
  kind: "ndis",
  label: "NDIS",
  total: 24000,
  used: 9120,
  remaining: 14880,
  percentUsed: 38,
  state: "ok",
};

const ENTRY: FundEntry = {
  id: "fund-1",
  clientId: CLIENT_ID,
  bucketKind: "ndis",
  type: "topup",
  amount: 6000,
  date: "2026-11-03",
  description: "NDIS quarterly plan top-up",
  recordedBy: "Helen Doyle",
};

beforeEach(() => {
  mocks.getBudgetSummary.mockResolvedValue([BUCKET]);
  mocks.getFundHistory.mockResolvedValue([ENTRY]);
  mocks.getToday.mockResolvedValue("2026-11-30");
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("[FAM-UI-05][PRD] loadFamilyBudgetData", () => {
  it("[FAM-UI-05][AC-01] gathers the bucket summaries, the fund history and today, and nothing else", async () => {
    const data = await loadFamilyBudgetData(CLIENT_ID);

    expect(data).toEqual({ buckets: [BUCKET], history: [ENTRY], today: "2026-11-30" });
  });

  it("[FAM-UI-05][AC-07] passes the pending figures and pending entries through as the contract gives them (CHG-020)", async () => {
    const pendingBucket: BudgetBucketSummary = { ...BUCKET, pendingTotal: 310, pendingCount: 1 };
    const pendingEntry: FundEntry = {
      ...ENTRY,
      id: "fund-2",
      type: "expense",
      amount: -310,
      description: "Physiotherapy",
      pending: true,
    };
    mocks.getBudgetSummary.mockResolvedValue([pendingBucket]);
    mocks.getFundHistory.mockResolvedValue([pendingEntry]);

    const data = await loadFamilyBudgetData(CLIENT_ID);

    expect(data.buckets).toEqual([pendingBucket]);
    expect(data.history).toEqual([pendingEntry]);
  });

  it("[FAM-UI-05][PRD] reads the two through the contract for the given client only, and not the header summary", async () => {
    await loadFamilyBudgetData(CLIENT_ID);

    expect(mocks.getBudgetSummary).toHaveBeenCalledExactlyOnceWith(CLIENT_ID);
    expect(mocks.getFundHistory).toHaveBeenCalledExactlyOnceWith(CLIENT_ID);
    expect(mocks.getClientHeaderSummary).not.toHaveBeenCalled();
    expect(mocks.getToday).toHaveBeenCalledTimes(1);
  });

  it("[FAM-UI-05][AC-03] passes an empty history and empty buckets through as they are", async () => {
    mocks.getBudgetSummary.mockResolvedValue([]);
    mocks.getFundHistory.mockResolvedValue([]);

    expect(await loadFamilyBudgetData(CLIENT_ID)).toEqual({
      buckets: [],
      history: [],
      today: "2026-11-30",
    });
  });

  it("[FAM-UI-05][PRD] keeps the contract's order: the loader does not re-sort the history", async () => {
    const older: FundEntry = { ...ENTRY, id: "fund-2", date: "2026-10-15" };
    mocks.getFundHistory.mockResolvedValue([older, ENTRY]);

    const { history } = await loadFamilyBudgetData(CLIENT_ID);

    expect(history.map((entry) => entry.id)).toEqual(["fund-2", "fund-1"]);
  });

  it.each([
    ["getBudgetSummary", () => mocks.getBudgetSummary.mockRejectedValue(new Error("x"))],
    ["getFundHistory", () => mocks.getFundHistory.mockRejectedValue(new Error("x"))],
    ["getToday", () => mocks.getToday.mockRejectedValue(new Error("x"))],
  ])("[FAM-UI-05][PRD] rejects as a whole when %s rejects", async (_name, rejectIt) => {
    rejectIt();

    await expect(loadFamilyBudgetData(CLIENT_ID)).rejects.toThrow("x");
  });
});
