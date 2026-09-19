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
  const instant = new Date(occurrence.start).getTime();
  return Number.isNaN(instant) ? Number.NEGATIVE_INFINITY : instant;
}

/** The contract's order: newest first by start instant, ties by key ascending. */
function newestFirst(a: Occurrence, b: Occurrence): number {
  const aStart = startOf(a);
  const bStart = startOf(b);
  if (aStart !== bStart) return aStart < bStart ? 1 : -1;
  if (a.key === b.key) return 0;
  return a.key < b.key ? -1 : 1;
}

/** Oldest first, as the Overdue card lists them. Returns a new array. */
export function sortOldestFirst(occurrences: Occurrence[]): Occurrence[] {
  return [...occurrences].sort((a, b) => -newestFirst(a, b));
}

/**
 * The latest things that have happened: done or overdue occurrences, newest
 * first (the contract's order), each occurrence once, capped at
 * `RECENT_ACTIVITY_LIMIT`. Planned occurrences are left out because they have
 * not happened yet. Returns a new array.
 */
export function selectRecentActivity(occurrences: Occurrence[]): Occurrence[] {
  const seen = new Set<string>();
  return occurrences
    .filter((occurrence) => {
      if (occurrence.status === "planned" || seen.has(occurrence.key)) return false;
      seen.add(occurrence.key);
      return true;
    })
    .sort(newestFirst)
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
 *
 * Correct for a log of any length, because it never reads the unfiltered log.
 * `getTaskLog` is newest first within each status filter, so:
 *  - Recent activity is the newest five of the done and overdue rows. If a row
 *    is in the top five of their union, at most four rows of the union are newer
 *    than it, so at most four rows of its own status list are newer, so it is in
 *    the top five of its own list. Page one of each of the two lists is
 *    therefore enough, however many years of history sit behind them. An
 *    unfiltered page one is not: the newest twenty rows can all be planned, and
 *    would hide every done and overdue row.
 *  - The Overdue card's rows are page one of the overdue list, cut to
 *    `OVERDUE_ROWS_SHOWN`; its count is the contract's `total`, never the
 *    number of rows fetched.
 * This needs `TASK_LOG_PAGE_SIZE` >= the number of rows taken from a page, which
 * a test pins (DECISIONS.md FD-16).
 */
export async function loadFamilyHomeData(clientId: string): Promise<FamilyHomeData> {
  const [today, overdue, done, budget] = await Promise.all([
    getTodayOccurrences(clientId),
    getTaskLog(clientId, { status: "overdue" }),
    getTaskLog(clientId, { status: "done" }),
    getBudgetSummary(clientId),
  ]);

  return {
    today,
    overdue: {
      // The newest few overdue, shown in date order as the design lists them.
      items: sortOldestFirst([...overdue.items].sort(newestFirst).slice(0, OVERDUE_ROWS_SHOWN)),
      total: overdue.total,
    },
    recent: selectRecentActivity([...done.items, ...overdue.items]),
    budget,
  };
}
