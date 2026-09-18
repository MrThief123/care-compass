/**
 * How much of an event block's detail fits at a given rendered height.
 *
 * A 15-minute event and a 3-hour event use the same block component; rather
 * than letting text spill out of the short one, the block asks for its density
 * tier and renders the detail that tier affords. What a tier drops is not lost
 * — it is shown in the popover when the block is clicked.
 */
export type BlockDensity = "compact" | "regular" | "full";

/**
 * Thresholds are the height the tier's content actually occupies, measured
 * against the rendered type ramp, not round numbers — a tier that starts below
 * what it needs clips its own last line.
 *
 * `regular` = title (16px at `leading-tight`) + time range (16px) + 8px of
 * vertical padding = 40px. `full` adds an assignee/status row (26px + 4px of
 * separation) = 70px, rounded to 72.
 */
const REGULAR_MIN_PX = 40;
const FULL_MIN_PX = 72;

/**
 * `compact`  — one line: title, with the time trailing it inline.
 * `regular`  — two lines: title, then the time range.
 * `full`     — title, time range, and the remaining detail (assignee, status).
 */
export function blockDensity(heightPx: number): BlockDensity {
  if (heightPx >= FULL_MIN_PX) return "full";
  if (heightPx >= REGULAR_MIN_PX) return "regular";
  return "compact";
}
