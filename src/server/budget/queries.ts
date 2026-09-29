/**
 * `budget` domain query contract (UI-00 — see feature DECISIONS.md FD-02
 * for why this file is created by UI-00 rather than a later Lane B
 * feature). Screens must import from here, never from `src/mocks`
 * directly (lint-enforced).
 */
import * as mock from "@/mocks/queries/budget";
import { getDataSourceMode, notImplementedForSupabase } from "@/server/data-source";
import type {
  BudgetBucketKind,
  BudgetBucketState,
  BudgetBucketSummary,
  FundEntry,
} from "@/types/domain";

/** `budget_threshold_state()`'s words (PD-032) mapped to the domain's (F0-12 DATA_MODEL.md). */
const THRESHOLD_STATE: Record<string, BudgetBucketState> = {
  normal: "ok",
  warning: "warning",
  alert: "alert",
  depleted: "exhausted",
};

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

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("budget_bucket_summary", { p_client_id: clientId });
  // The message names no client (ARCHITECTURE.md §12.5).
  if (error || !data) throw new Error("getBudgetSummary: could not load the budget.");

  return data.map((bucket) => ({
    id: bucket.bucket_id,
    kind: (bucket.kind as BudgetBucketKind | null) ?? undefined,
    label: bucket.name,
    total: bucket.total,
    used: bucket.used,
    remaining: bucket.remaining,
    percentUsed: bucket.percent_used ?? 0,
    state: THRESHOLD_STATE[bucket.threshold_state] ?? "ok",
    pendingTotal: bucket.pending_total,
    pendingCount: bucket.pending_count,
  }));
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
