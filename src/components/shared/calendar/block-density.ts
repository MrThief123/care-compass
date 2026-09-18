/**
 * How much of an event block's detail fits at a given rendered height.
 *
 * A 15-minute event and a 3-hour event use the same block component; rather
 * than letting text spill out of the short one, the block asks for its density
 * tier and renders the detail that tier affords. What a tier drops is not lost
 * — it is shown in the popover when the block is clicked.
 */
export type BlockDensity = "compact" | "regular" | "full";

/** Below this many px only a single line of text fits. */
const REGULAR_MIN_PX = 30;
/** At or above this many px there is room for a third line and a status pill. */
const FULL_MIN_PX = 56;

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
