/**
 * Data the Family · Budget screen needs, read only through the `src/server/**`
 * contract (CLAUDE.md §7). The client's header summary is not read: the shell
 * header owns it (DECISIONS.md FD-08).
 */
import { getBudgetSummary, getFundHistory } from "@/server/budget/queries";
import { settleEndedEventCosts } from "@/server/budget/settle";
import { getToday } from "@/server/events/queries";
import type { BudgetBucketSummary, FundEntry } from "@/types/domain";

export interface FamilyBudgetData {
  buckets: BudgetBucketSummary[];
  /** As the contract gives it: newest first. */
  history: FundEntry[];
  /** The reference day (`YYYY-MM-DD`), which a saved update is dated (CHG-020). */
  today: string;
}

export async function loadFamilyBudgetData(clientId: string): Promise<FamilyBudgetData> {
  // FAM-11: charge any plain event that has ended, so the figures below include it.
  await settleEndedEventCosts(clientId);
  const [buckets, history, today] = await Promise.all([
    getBudgetSummary(clientId),
    getFundHistory(clientId),
    getToday(),
  ]);
  return { buckets, history, today };
}
