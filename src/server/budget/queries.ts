/**
 * `budget` domain query contract (UI-00 — see feature DECISIONS.md FD-02
 * for why this file is created by UI-00 rather than a later Lane B
 * feature). Screens must import from here, never from `src/mocks`
 * directly (lint-enforced).
 */
import * as mock from "@/mocks/queries/budget";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";
import type { BudgetBucketSummary } from "@/types/domain";

export async function getBudgetSummary(clientId: string): Promise<BudgetBucketSummary[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getBudgetSummary(clientId);
  }
  notImplementedForSupabase("budget", "getBudgetSummary");
}
