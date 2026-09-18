/**
 * How much of an event block's detail fits at a given rendered height.
 *
 * A 15-minute event and a 3-hour event use the same block component; rather
 * than letting text spill out of the short one, the block asks for its density
 * tier and renders the detail that tier affords. What a tier drops is not lost
 * — it is shown in the card the block opens on hover.
 */
export type BlockDensity = "compact" | "regular" | "full";

/** A block's border, top and bottom — blocks are sized border-box. */
export const BLOCK_BORDER_PX = 2;
/** A block's own vertical padding (`py-1`), top and bottom. */
export const BLOCK_PADDING_PX = 8;
/**
 * One line of title: `text-body-small` (13px) at `leading-tight` is 16.25px,
 * rounded up. Rounding up costs a line at the boundary; rounding down would
 * clip the last one, and a clipped line is the defect this whole tier system
 * exists to avoid.
 */
export const TITLE_LINE_PX = 17;
/** The time row under the title (`text-body-secondary`, 12/16). */
export const TIME_LINE_PX = 16;
/** A secondary detail line, such as the week grid's assignee (12/16). */
export const DETAIL_LINE_PX = 16;
/**
 * The day view's status row: `StatusPill` (an 18px line box, `py-1` and a 1px
 * border = 28px) over `pt-1` of separation. A pill that renders taller than
 * this costs the title a line rather than the time range — see the views'
 * `shrink-0` rows.
 */
export const STATUS_ROW_PX = 32;

/** Everything a block spends before any of its content: border and padding. */
export const BLOCK_CHROME_PX = BLOCK_BORDER_PX + BLOCK_PADDING_PX;

/**
 * Thresholds are the height the tier's content actually occupies, built from
 * the row metrics above rather than written as round numbers — a tier that
 * starts below what it needs clips its own last line.
 */
const REGULAR_MIN_PX = BLOCK_CHROME_PX + TITLE_LINE_PX + TIME_LINE_PX;
const FULL_MIN_PX = REGULAR_MIN_PX + STATUS_ROW_PX;

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

/** The deepest `line-clamp-*` utility Tailwind provides. */
const MAX_TITLE_LINES = 6;

/**
 * How many lines a block's title may wrap onto.
 *
 * Truncating every title to one line loses the end of the long ones, but
 * wrapping freely pushes the time range out of the block. So the title gets
 * the height left over once everything else the block must show is reserved
 * (`reservedPx`: `BLOCK_CHROME_PX`, the time row, and any status or assignee
 * row the density tier adds) — and is cut off with an ellipsis beyond that.
 *
 * Every term is rounded so the count can only ever *under*-estimate what fits:
 * a line too few shows an ellipsis, a line too many would be cut through.
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
