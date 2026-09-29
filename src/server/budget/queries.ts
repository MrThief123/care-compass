/**
 * `budget` domain query contract (UI-00 — see feature DECISIONS.md FD-02
 * for why this file is created by UI-00 rather than a later Lane B
 * feature). Screens must import from here, never from `src/mocks`
 * directly (lint-enforced).
 */
import * as mock from "@/mocks/queries/budget";
import { getDataSourceMode } from "@/server/data-source";
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
 *
 * Two append-only sources, merged (FAM-10): `budget_fund_entries` (signed by
 * kind — `funds_added`/`bucket_added` are non-negative, `funds_removed`/
 * `bucket_removed` are negative, so the sign alone gives `topup` vs.
 * `expense`) and `budget_costs` (always a positive `amount`, negated here;
 * `status = 'pending'` sets `pending`). `date` is always `incurred_on`\
 * /`entry_date`; `paidOn` (CHG-022, PD-060) is set only when a cost was
 * pending before being paid on a later day (`paid_on` differs from
 * `incurred_on`), so a cost paid the same day it was incurred reads as a
 * plain paid expense, matching the mock contract.
 */
export async function getFundHistory(clientId: string): Promise<FundEntry[]> {
  const mode = getDataSourceMode();
  if (mode === "mock") {
    return mock.getFundHistory(clientId);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const [fundEntries, costs] = await Promise.all([
    supabase
      .from("budget_fund_entries")
      .select(
        "id, client_id, bucket_id, amount, entry_date, description, note, recorded_by_name, bucket:budget_buckets(kind)",
      )
      .eq("client_id", clientId),
    supabase
      .from("budget_costs")
      .select(
        "id, client_id, bucket_id, amount, status, incurred_on, paid_on, description, note, recorded_by_name, bucket:budget_buckets(kind)",
      )
      .eq("client_id", clientId),
  ]);
  // The message names no client (ARCHITECTURE.md §12.5).
  if (fundEntries.error || !fundEntries.data || costs.error || !costs.data) {
    throw new Error("getFundHistory: could not load the budget history.");
  }

  const topUpsAndAdjustments: FundEntry[] = fundEntries.data.map((row) => ({
    id: row.id,
    clientId: row.client_id,
    bucketId: row.bucket_id,
    bucketKind: (row.bucket?.kind as BudgetBucketKind | null) ?? undefined,
    type: row.amount >= 0 ? "topup" : "expense",
    amount: row.amount,
    date: row.entry_date,
    description: row.description || undefined,
    recordedBy: row.recorded_by_name,
    note: row.note ?? undefined,
  }));

  const expenses: FundEntry[] = costs.data.map((row) => ({
    id: row.id,
    clientId: row.client_id,
    bucketId: row.bucket_id,
    bucketKind: (row.bucket?.kind as BudgetBucketKind | null) ?? undefined,
    type: "expense",
    amount: -row.amount,
    date: row.incurred_on,
    description: row.description || undefined,
    recordedBy: row.recorded_by_name,
    pending: row.status === "pending" ? true : undefined,
    paidOn:
      row.status === "paid" && row.paid_on && row.paid_on !== row.incurred_on
        ? row.paid_on
        : undefined,
    note: row.note ?? undefined,
  }));

  return [...topUpsAndAdjustments, ...expenses].sort((a, b) => b.date.localeCompare(a.date));
}
