/**
 * Data the Family · Home screen needs, read only through the `src/server/**`
 * contract (CLAUDE.md §7). The selectors are pure so the screen's ordering and
 * totals can be tested without rendering anything.
 */
import { getBudgetSummary } from "@/server/budget/queries";
import { getTaskLog, getTodayOccurrences } from "@/server/events/queries";
import type { BudgetBucketSummary, Occurrence } from "@/types/domain";

/** Rows in the Recent activity card (the design shows five). */
export const RECENT_ACTIVITY_LIMIT = 5;

/** Rows the Overdue card lists; the badge and "View all" carry the full count. */
export const OVERDUE_ROWS_SHOWN = 5;

export interface BudgetTotals {
  total: number;
  used: number;
  remaining: number;
  /** Whole percent, from the summed figures rather than an average of the buckets. */
  percentUsed: number;
}

export interface FamilyHomeData {
  today: Occurrence[];
  overdue: { items: Occurrence[]; total: number };
  recent: Occurrence[];
  budget: BudgetBucketSummary[];
}

function startOf(occurrence: Occurrence): number {
  // Compare instants: two ISO strings with different UTC offsets do not sort as text.
  return new Date(occurrence.start).getTime();
}

/** Oldest first, as the Overdue card lists them. Returns a new array. */
export function sortOldestFirst(occurrences: Occurrence[]): Occurrence[] {
  return [...occurrences].sort((a, b) => startOf(a) - startOf(b));
}

/**
 * The latest things that have happened: done or overdue occurrences, newest
 * first, capped at `RECENT_ACTIVITY_LIMIT`. Planned occurrences are left out
 * because they have not happened yet. Returns a new array.
 */
export function selectRecentActivity(occurrences: Occurrence[]): Occurrence[] {
  return occurrences
    .filter((occurrence) => occurrence.status !== "planned")
    .sort((a, b) => startOf(b) - startOf(a))
    .slice(0, RECENT_ACTIVITY_LIMIT);
}

/** The Budget strip's aggregate line: everything remaining of everything funded. */
export function summariseBudget(buckets: BudgetBucketSummary[]): BudgetTotals {
  const total = buckets.reduce((sum, bucket) => sum + bucket.total, 0);
  const used = buckets.reduce((sum, bucket) => sum + bucket.used, 0);
  const remaining = buckets.reduce((sum, bucket) => sum + bucket.remaining, 0);
  return {
    total,
    used,
    remaining,
    percentUsed: total === 0 ? 0 : Math.round((used / total) * 100),
  };
}

/**
 * Loads all four panels together, so the screen has one loading state and one
 * error state. A rejection from any contract function rejects the whole load.
 */
export async function loadFamilyHomeData(clientId: string): Promise<FamilyHomeData> {
  const [today, overdue, log, budget] = await Promise.all([
    getTodayOccurrences(clientId),
    getTaskLog(clientId, { status: "overdue" }),
    getTaskLog(clientId),
    getBudgetSummary(clientId),
  ]);

  return {
    today,
    overdue: { items: sortOldestFirst(overdue.items), total: overdue.total },
    recent: selectRecentActivity(log.items),
    budget,
  };
}
