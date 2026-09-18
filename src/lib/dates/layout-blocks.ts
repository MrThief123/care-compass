/**
 * Horizontal (column) placement for timed blocks that overlap in a single day
 * column, on top of the vertical placement `positionBlocks` already provides.
 *
 * Two events at the same time must sit side by side rather than on top of one
 * another (the reference day/week calendars do this), and a very short event
 * still needs enough height to read its title — so a rendered minimum is
 * applied here and the true duration height kept alongside it.
 */
import { positionBlocks, type PositionOptions, type PositionedBlock } from "./position-blocks";

export interface LayoutOptions extends PositionOptions {
  /**
   * Smallest height a block is rendered at, in px, so a 10-minute event is
   * still clickable and its title still fits (default 22 = half an hour row).
   */
  minHeightPx?: number;
}

export interface LaidOutBlock<T> extends PositionedBlock<T> {
  /** 0-based column within this block's overlap cluster. */
  columnIndex: number;
  /** Number of side-by-side columns in this block's overlap cluster. */
  columnCount: number;
  /** Height the duration alone would give, before `minHeightPx` was applied. */
  durationHeight: number;
}

/**
 * Positions blocks vertically (via `positionBlocks`) and then assigns each one
 * a column so overlapping blocks share the width of their day column.
 *
 * Blocks are grouped into clusters of transitively overlapping blocks; within a
 * cluster each block takes the first column whose last block has already
 * ended. Every block in a cluster reports the same `columnCount`, so callers
 * can size them with `columnIndex / columnCount` fractions.
 *
 * Returned in visual order (top first, longest first on a tie).
 */
export function layoutBlocks<T extends { start: string; durationMinutes: number }>(
  occurrences: T[],
  { minHeightPx = 22, ...positionOptions }: LayoutOptions = {},
): LaidOutBlock<T>[] {
  const blocks: LaidOutBlock<T>[] = positionBlocks(occurrences, positionOptions)
    .map((block) => ({
      ...block,
      durationHeight: block.height,
      height: Math.max(block.height, minHeightPx),
      columnIndex: 0,
      columnCount: 1,
    }))
    .sort((a, b) => a.top - b.top || b.height - a.height);

  let cluster: LaidOutBlock<T>[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = Number.NEGATIVE_INFINITY;

  const closeCluster = () => {
    for (const block of cluster) block.columnCount = columnEnds.length;
    cluster = [];
    columnEnds = [];
    clusterEnd = Number.NEGATIVE_INFINITY;
  };

  for (const block of blocks) {
    if (cluster.length > 0 && block.top >= clusterEnd) closeCluster();

    const free = columnEnds.findIndex((end) => end <= block.top);
    block.columnIndex = free === -1 ? columnEnds.length : free;
    columnEnds[block.columnIndex] = block.top + block.height;

    cluster.push(block);
    clusterEnd = Math.max(clusterEnd, block.top + block.height);
  }
  closeCluster();

  return blocks;
}
