import { describe, expect, it } from "vitest";

import { lastPageFor, pageRange, pageWindow } from "./pagination";

describe("lastPageFor", () => {
  it.each([
    [0, 20, 1],
    [1, 20, 1],
    [19, 20, 1],
    [20, 20, 1],
    [21, 20, 2],
    [40, 20, 2],
    [41, 20, 3],
    [137, 20, 7],
    [537, 20, 27],
    [51, 25, 3],
  ])("[FAM-UI-07][AC-05] %i rows at %i a page is %i page(s)", (total, pageSize, expected) => {
    expect(lastPageFor(total, pageSize)).toBe(expected);
  });

  it("[FAM-UI-07][AC-05] never divides by a broken page size", () => {
    expect(lastPageFor(50, 0)).toBe(1);
    expect(lastPageFor(50, -5)).toBe(1);
    expect(lastPageFor(Number.NaN, 20)).toBe(1);
  });
});

describe("pageRange", () => {
  it.each([
    [1, 20, 137, { from: 1, to: 20 }],
    [2, 20, 137, { from: 21, to: 40 }],
    [7, 20, 137, { from: 121, to: 137 }],
    [27, 20, 537, { from: 521, to: 537 }],
    [1, 20, 20, { from: 1, to: 20 }],
    [2, 20, 21, { from: 21, to: 21 }],
    [1, 20, 9, { from: 1, to: 9 }],
    [1, 20, 0, { from: 0, to: 0 }],
  ])(
    "[FAM-UI-07][AC-05] page %i of %i-a-page over %i rows shows %j",
    (page, size, total, range) => {
      expect(pageRange(page, size, total)).toEqual(range);
    },
  );
});

describe("pageWindow", () => {
  it("[FAM-UI-07][AC-05] lists every page when there are seven or fewer", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("[FAM-UI-07][AC-05] near the start keeps the first pages and the last, with one gap", () => {
    expect(pageWindow(1, 27)).toEqual([1, 2, 3, 4, 5, "gap", 27]);
    expect(pageWindow(4, 27)).toEqual([1, 2, 3, 4, 5, "gap", 27]);
  });

  it("[FAM-UI-07][AC-05] in the middle keeps the first, the neighbours of the current page and the last", () => {
    expect(pageWindow(14, 27)).toEqual([1, "gap", 13, 14, 15, "gap", 27]);
  });

  it("[FAM-UI-07][AC-05] near the end keeps the first and the last pages, with one gap", () => {
    expect(pageWindow(27, 27)).toEqual([1, "gap", 23, 24, 25, 26, 27]);
    expect(pageWindow(24, 27)).toEqual([1, "gap", 23, 24, 25, 26, 27]);
  });

  it("[FAM-UI-07][AC-05] always contains the current page and stays at seven slots for any long log", () => {
    for (const last of [8, 9, 27, 500, 50_000]) {
      for (const page of [1, 2, 4, 5, Math.ceil(last / 2), last - 3, last - 1, last]) {
        const window = pageWindow(page, last);
        expect(window).toContain(page);
        expect(window).toHaveLength(7);
        expect(window[0]).toBe(1);
        expect(window.at(-1)).toBe(last);
      }
    }
  });
});
