/**
 * How much of an event block's detail fits at a given rendered height.
 *
 * A 15-minute event and a 3-hour event use the same block component; rather
 * than letting text spill out of the short one, the block asks for its density
 * tier and renders the detail that tier affords. What a tier drops is not lost
 * — it is shown in the card the block opens on hover.
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

/** A block's own vertical padding (`py-1`), top and bottom. */
export const BLOCK_PADDING_PX = 8;
/** The time row under the title (`text-body-secondary`, 12/16). */
export const TIME_LINE_PX = 16;
/**
 * One line of title: 13px at `leading-tight` is 16.25px, rounded up. Rounding
 * up costs a line at the boundary; rounding down would clip the last one, and
 * a clipped line is the defect this whole tier system exists to avoid.
 */
export const TITLE_LINE_PX = 17;

/** The deepest `line-clamp-*` utility Tailwind provides. */
const MAX_TITLE_LINES = 6;

/**
 * How many lines a block's title may wrap onto.
 *
 * Truncating every title to one line loses the end of the long ones, but
 * wrapping freely pushes the time range out of the block. So the title gets
 * the height left over once everything else the block must show is reserved
 * (`reservedPx`: padding, the time row, and any status or assignee row the
 * density tier adds) — and is cut off with an ellipsis beyond that.
 */
export function titleLines(heightPx: number, reservedPx: number): number {
  const spare = Math.floor((heightPx - reservedPx) / TITLE_LINE_PX);
  return Math.min(MAX_TITLE_LINES, Math.max(1, spare));
}

/**
 * The clamp utility for a line count. Written out in full rather than built by
 * interpolation so Tailwind's scanner can see every class it must generate.
 */
export function titleClampClass(lines: number): string {
  const CLAMP = [
    "line-clamp-1",
    "line-clamp-2",
    "line-clamp-3",
    "line-clamp-4",
    "line-clamp-5",
    "line-clamp-6",
  ];
  return CLAMP[Math.min(CLAMP.length, Math.max(1, lines)) - 1]!;
}
