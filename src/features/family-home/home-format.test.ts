import { describe, expect, it } from "vitest";

import { formatDollars, shortDate } from "./home-format";

describe("[FAM-UI-01][PRD] shortDate", () => {
  it("writes 'Mon 30 Nov' from an ISO instant or a Date, in Melbourne time", () => {
    expect(shortDate("2026-11-30T09:00:00+11:00")).toBe("Mon 30 Nov");
    expect(shortDate(new Date("2026-11-27T10:00:00+11:00"))).toBe("Fri 27 Nov");
  });

  it("keeps September to three letters, 'Sep', not the en-AU 'Sept'", () => {
    expect(shortDate("2026-09-19T09:00:00+10:00")).toBe("Sat 19 Sep");
  });

  it("gives every month a three-letter abbreviation", () => {
    for (let month = 1; month <= 12; month += 1) {
      const label = shortDate(`2026-${String(month).padStart(2, "0")}-15T12:00:00+11:00`);
      expect(label.split(" ")[2], label).toHaveLength(3);
    }
  });

  it("uses the Melbourne date, not the UTC date, either side of local midnight", () => {
    expect(shortDate("2026-11-30T12:59:00Z")).toBe("Mon 30 Nov"); // 23:59 in Melbourne
    expect(shortDate("2026-11-30T13:00:00Z")).toBe("Tue 1 Dec"); // 00:00 in Melbourne
  });
});

describe("[FAM-UI-01][AC-03] formatDollars", () => {
  it("shows whole dollars without cents, exactly as the design does", () => {
    expect(formatDollars(14880)).toBe("$14,880");
    expect(formatDollars(240)).toBe("$240");
    expect(formatDollars(0)).toBe("$0");
  });

  it("shows cents whenever the amount has any, instead of rounding them away", () => {
    expect(formatDollars(1234567.89)).toBe("$1,234,567.89");
    expect(formatDollars(0.5)).toBe("$0.50");
    expect(formatDollars(999999999999.99)).toBe("$999,999,999,999.99");
  });

  it("is not thrown off by floating-point sums", () => {
    expect(formatDollars(0.1 + 0.2)).toBe("$0.30");
    expect(formatDollars(1234567.89 - 1.1)).toBe("$1,234,566.79");
  });

  it("treats an amount that rounds to whole dollars as whole dollars", () => {
    expect(formatDollars(99.999)).toBe("$100");
  });

  it("puts the minus sign before the dollar sign, and never shows '-$0'", () => {
    expect(formatDollars(-360)).toBe("-$360");
    expect(formatDollars(-0.25)).toBe("-$0.25");
    expect(formatDollars(-0.001)).toBe("$0");
  });
});
