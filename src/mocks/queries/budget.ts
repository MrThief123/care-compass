/**
 * Mock (fixture-backed) implementation of the `budget` domain contract.
 * Read only by `src/server/budget/queries.ts` — never imported directly
 * by `src/app` or `src/features`.
 */
import {
  FUND_ENTRIES,
  RAW_BUDGET_BUCKETS_BY_CLIENT_ID,
  deriveBudgetBucketSummary,
} from "@/mocks/fixtures";
import type { BudgetBucketSummary, FundEntry } from "@/types/domain";

/**
 * Each bucket's figures, with its pending costs (CHG-020, PD-058) counted from
 * the client's pending fund entries for that bucket (by `bucketId`, CHG-021). Pending costs are not taken
 * off `used` or `remaining`.
 */
export async function getBudgetSummary(clientId: string): Promise<BudgetBucketSummary[]> {
  const raw = RAW_BUDGET_BUCKETS_BY_CLIENT_ID[clientId] ?? [];
  const pending = FUND_ENTRIES.filter((entry) => entry.clientId === clientId && entry.pending);
  return raw.map((bucket) => {
    const ofBucket = pending.filter((entry) => entry.bucketId === bucket.id);
    const pendingCents = ofBucket.reduce((sum, entry) => sum + Math.round(-entry.amount * 100), 0);
    return {
      ...deriveBudgetBucketSummary(bucket),
      pendingTotal: pendingCents / 100,
      pendingCount: ofBucket.length,
    };
  });
}

/**
 * The client's fund entries, newest first, pending costs among them by date.
 * Copies, so a caller cannot change the fixtures.
 */
export async function getFundHistory(clientId: string): Promise<FundEntry[]> {
  return FUND_ENTRIES.filter((entry) => entry.clientId === clientId)
    .map((entry) => ({ ...entry }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
