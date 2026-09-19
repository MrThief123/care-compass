/** Paging arithmetic for the Task log pager. Pure; every function copes with a broken page size or total. */

export type PageSlot = number | "gap";

/** Number of pages for `total` rows; always at least 1, and 1 for a broken total or page size. */
export function lastPageFor(total: number, pageSize: number): number {
  if (!Number.isFinite(total) || !Number.isFinite(pageSize) || pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

/** The 1-based rows a page shows, for 'Showing 21-40 of 137'; 0-0 when there are no rows. */
export function pageRange(
  page: number,
  pageSize: number,
  total: number,
): { from: number; to: number } {
  if (total <= 0) return { from: 0, to: 0 };
  return { from: (page - 1) * pageSize + 1, to: Math.min(page * pageSize, total) };
}

/**
 * The page numbers to link to: every page when there are 7 or fewer, else always 7 slots
 * (first, last, the current page and its neighbours, and "gap" markers), so a log of any
 * length keeps a pager of one size.
 */
export function pageWindow(page: number, last: number): PageSlot[] {
  if (last <= 7) return Array.from({ length: last }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "gap", last];
  if (page >= last - 3) return [1, "gap", last - 4, last - 3, last - 2, last - 1, last];
  return [1, "gap", page - 1, page, page + 1, "gap", last];
}
