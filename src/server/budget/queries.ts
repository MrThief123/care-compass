/**
 * `budget` domain query contract (UI-00 — see feature DECISIONS.md FD-02
 * for why this file is created by UI-00 rather than a later Lane B
 * feature). Screens must import from here, never from `src/mocks`
 * directly (lint-enforced).
 */
import * as mock from "@/mocks/queries/budget";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";
import type { BudgetBucketSummary, FundEntry } from "@/types/domain";

/**
 * The client's buckets, each with a stable `id` (CHG-021) and its pending
 * costs (CHG-020, PD-058): `pendingTotal` and `pendingCount`, not taken off
 * `used` or `remaining`. `kind` is set only on the suggested buckets.
 */
export async function getBudgetSummary(clientId: string): Promise<BudgetBucketSummary[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getBudgetSummary(clientId);
  }
  notImplementedForSupabase("budget", "getBudgetSummary");
}

/**
 * The client's fund entries (top-ups and expenses), newest first; `[]` for
 * none. Each names its bucket by `bucketId` (CHG-021). Pending costs
 * (`pending: true`, CHG-020) are among them by date.
 */
export async function getFundHistory(clientId: string): Promise<FundEntry[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getFundHistory(clientId);
  }
  notImplementedForSupabase("budget", "getFundHistory");
}
