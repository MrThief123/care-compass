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

export async function getBudgetSummary(clientId: string): Promise<BudgetBucketSummary[]> {
  const raw = RAW_BUDGET_BUCKETS_BY_CLIENT_ID[clientId] ?? [];
  return raw.map(deriveBudgetBucketSummary);
}

/** The client's fund entries, newest first. Copies, so a caller cannot change the fixtures. */
export async function getFundHistory(clientId: string): Promise<FundEntry[]> {
  return FUND_ENTRIES.filter((entry) => entry.clientId === clientId)
    .map((entry) => ({ ...entry }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
