import type { OccurrenceStatus } from "@/types/domain";

/**
 * Local overrides for the shared `StatusPill` wherever the Task log and Task detail show one
 * (DECISIONS.md FD-20, FD-21, FD-23); the kit component itself is not lane F's to edit.
 *
 * - `min-w-0` and `[&>svg]:shrink-0`: the pill may shrink below its text (its label ends in an
 *   ellipsis) but its icon keeps its size.
 * - `py-[3px]`: 26px tall, the design's pill height, where the kit pill is 26px (Done) or 28px
 *   (Planned and Overdue, which have a border).
 * - A Done pill has no border in the kit, so it gets a transparent one: all three pills are then
 *   the same height (26px) and rows do not change height with status.
 */
export function statusPillClassName(status: OccurrenceStatus): string {
  return status === "done"
    ? "min-w-0 border border-transparent py-[3px] [&>svg]:shrink-0"
    : "min-w-0 py-[3px] [&>svg]:shrink-0";
}
