import { describe, expect, it } from "vitest";

import {
  BLOCK_BORDER_PX,
  BLOCK_PADDING_PX,
  DETAIL_LINE_PX,
  STATUS_ROW_PX,
  TIME_LINE_PX,
  TITLE_LINE_PX,
  blockDensity,
  titleClampClass,
  titleLines,
} from "./block-density";

describe("[UI-01] block metrics", () => {
  // Every tier threshold and every reservation is built from these, so a block
  // can never be given a tier whose content is taller than the block itself.
  it("measures each row against the rendered type ramp", () => {
    expect(BLOCK_BORDER_PX).toBe(2); // 1px top + 1px bottom
    expect(BLOCK_PADDING_PX).toBe(8); // py-1 top + bottom
    expect(TITLE_LINE_PX).toBe(17); // text-body-small 13px at leading-tight
    expect(TIME_LINE_PX).toBe(16); // text-body-secondary 12/16
    expect(DETAIL_LINE_PX).toBe(16); // assignee line, text-body-secondary
    expect(STATUS_ROW_PX).toBe(32); // pt-1 + StatusPill (18 + py-1 + border)
  });
});

describe("[UI-01] blockDensity", () => {
  it("returns compact for a block too short for two lines", () => {
    expect(blockDensity(22)).toBe("compact");
    // A 45-minute event at the default 44px hour row is 33px — one line only.
    expect(blockDensity(33)).toBe("compact");
    // Two lines need the border, the padding, a title line and the time row.
    expect(blockDensity(42)).toBe("compact");
  });

  it("returns regular once two lines fit", () => {
    expect(blockDensity(43)).toBe("regular");
    // A 60-minute event is exactly one 44px row.
    expect(blockDensity(44)).toBe("regular");
    expect(blockDensity(74)).toBe("regular");
  });

  it("returns full only once the status row fits under those two lines", () => {
    expect(blockDensity(75)).toBe("full");
    // A 2-hour event is 88px.
    expect(blockDensity(88)).toBe("full");
  });
});

describe("[UI-01] titleLines", () => {
  // `reservedPx` is what the block spends on everything but the title: 26 for
  // a regular block (border, padding and the time range), 58 once the day
  // view's status row is there too.
  it("keeps the title on one line when nothing but the title fits", () => {
    expect(titleLines(43, 26)).toBe(1);
    // Short blocks would compute a negative number of lines; one is the floor.
    expect(titleLines(22, 26)).toBe(1);
  });

  it("spends spare height on extra title lines", () => {
    expect(titleLines(42, 26)).toBe(1);
    expect(titleLines(60, 26)).toBe(2);
    expect(titleLines(94, 26)).toBe(4);
  });

  it("counts only the height left over after the fixed rows", () => {
    // 88px is a 2-hour block: 30px spare over the day view's status row, which
    // is one title line — not the two a status row measured short would allow.
    expect(titleLines(88, 58)).toBe(1);
    // The same block gives more away when there is no status row to reserve.
    expect(titleLines(88, 26)).toBe(3);
  });

  it("never asks for a deeper clamp than the styles provide", () => {
    expect(titleLines(400, 26)).toBe(6);
  });
});

describe("[UI-01] titleClampClass", () => {
  it("maps a line count to its clamp utility", () => {
    expect(titleClampClass(1)).toBe("line-clamp-1");
    expect(titleClampClass(3)).toBe("line-clamp-3");
    expect(titleClampClass(6)).toBe("line-clamp-6");
  });

  it("clamps an out-of-range count into the utilities that exist", () => {
    expect(titleClampClass(0)).toBe("line-clamp-1");
    expect(titleClampClass(9)).toBe("line-clamp-6");
  });
});
