import { describe, expect, it } from "vitest";

import { layoutBlocks } from "./layout-blocks";

interface Fixture {
  id: string;
  start: string;
  durationMinutes: number;
}

function at(id: string, time: string, durationMinutes: number): Fixture {
  return { id, start: `2026-11-30T${time}:00+11:00`, durationMinutes };
}

describe("[UI-01] layoutBlocks", () => {
  it("gives a lone block the full width of its column", () => {
    const [block] = layoutBlocks([at("a", "09:00", 60)]);
    expect(block).toMatchObject({ columnIndex: 0, columnCount: 1, top: 88, height: 44 });
  });

  it("splits two overlapping blocks into two columns", () => {
    const blocks = layoutBlocks([at("a", "09:00", 60), at("b", "09:30", 60)]);
    expect(blocks.map((b) => [b.item.id, b.columnIndex, b.columnCount])).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
    ]);
  });

  it("keeps sequential blocks in one column", () => {
    const blocks = layoutBlocks([at("a", "09:00", 60), at("b", "10:00", 60)]);
    expect(blocks.every((b) => b.columnCount === 1 && b.columnIndex === 0)).toBe(true);
  });

  it("reuses a freed column within a cluster", () => {
    // a spans 09:00-12:00; b and c sit beside it back to back.
    const blocks = layoutBlocks([
      at("a", "09:00", 180),
      at("b", "09:00", 60),
      at("c", "10:00", 60),
    ]);
    const byId = Object.fromEntries(blocks.map((b) => [b.item.id, b]));
    expect(byId.a!.columnIndex).toBe(0);
    expect(byId.b!.columnIndex).toBe(1);
    expect(byId.c!.columnIndex).toBe(1);
    expect(blocks.every((b) => b.columnCount === 2)).toBe(true);
  });

  it("raises a very short block to the minimum height and keeps its true height", () => {
    const [block] = layoutBlocks([at("a", "09:00", 10)]);
    // rowPx 44 → 10 min is 7.33px, below the 22px minimum.
    expect(block!.durationHeight).toBeCloseTo(7.33, 1);
    expect(block!.height).toBe(22);
  });

  it("honours a custom minHeightPx", () => {
    const [block] = layoutBlocks([at("a", "09:00", 10)], { minHeightPx: 30 });
    expect(block!.height).toBe(30);
  });
});
