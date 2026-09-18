import { describe, expect, it } from "vitest";

import { blockDensity, titleClampClass, titleLines } from "./block-density";

describe("[UI-01] blockDensity", () => {
  it("returns compact for a block too short for two lines", () => {
    expect(blockDensity(22)).toBe("compact");
    // A 45-minute event at the default 44px hour row is 33px — one line only.
    expect(blockDensity(33)).toBe("compact");
    expect(blockDensity(39)).toBe("compact");
  });

  it("returns regular once two lines fit", () => {
    // A 60-minute event is exactly one 44px row.
    expect(blockDensity(44)).toBe("regular");
    expect(blockDensity(71)).toBe("regular");
  });

  it("returns full once the whole detail fits", () => {
    // A 2-hour event is 88px.
    expect(blockDensity(72)).toBe("full");
    expect(blockDensity(88)).toBe("full");
  });
});

describe("[UI-01] titleLines", () => {
  // `reservedPx` is what the block spends on everything but the title: 24 for
  // a regular block (time range + padding), 54 once the day view's status row
  // is there too.
  it("keeps the title on one line when nothing but the title fits", () => {
    expect(titleLines(40, 24)).toBe(1);
    // Short blocks would compute a negative number of lines; one is the floor.
    expect(titleLines(22, 24)).toBe(1);
  });

  it("spends spare height on extra title lines", () => {
    expect(titleLines(41, 24)).toBe(1);
    expect(titleLines(58, 24)).toBe(2);
    expect(titleLines(92, 24)).toBe(4);
  });

  it("counts only the height left over after the fixed rows", () => {
    // 88px is a 2-hour block: 34px spare over the day view's status row.
    expect(titleLines(88, 54)).toBe(2);
    // The same block gives more away when there is no status row to reserve.
    expect(titleLines(88, 24)).toBe(3);
  });

  it("never asks for a deeper clamp than the styles provide", () => {
    expect(titleLines(400, 24)).toBe(6);
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
