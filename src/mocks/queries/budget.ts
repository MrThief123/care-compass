/**
 * Mock (fixture-backed) implementation of the `budget` domain contract.
 * Read only by `src/server/budget/queries.ts` — never imported directly
 * by `src/app` or `src/features`.
 */
import { RAW_BUDGET_BUCKETS_BY_CLIENT_ID, deriveBudgetBucketSummary } from "@/mocks/fixtures";
import type { BudgetBucketSummary } from "@/types/domain";

export async function getBudgetSummary(clientId: string): Promise<BudgetBucketSummary[]> {
  const raw = RAW_BUDGET_BUCKETS_BY_CLIENT_ID[clientId] ?? [];
  return raw.map(deriveBudgetBucketSummary);
}
