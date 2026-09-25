import { describe, expect, it } from "vitest";

import { formatFundDate, formatSignedDollars } from "./budget-format";

describe("[FAM-UI-05][PRD] formatFundDate (FD-04)", () => {
  it.each([
    ["2026-11-03", "3 Nov 2026"],
    ["2026-10-15", "15 Oct 2026"],
    ["2026-10-01", "1 Oct 2026"],
  ])("[FAM-UI-05][AC-02] writes %s as the design does: %s", (iso, expected) => {
    expect(formatFundDate(iso)).toBe(expected);
  });

  it("[FAM-UI-05][PRD] has no leading zero on the day and writes September as 'Sep', never 'Sept'", () => {
    expect(formatFundDate("2026-09-05")).toBe("5 Sep 2026");
    expect(formatFundDate("2026-09-30")).toBe("30 Sep 2026");
  });

  it("[FAM-UI-05][PRD] names every month with exactly three letters", () => {
    const months = Array.from({ length: 12 }, (_, index) =>
      formatFundDate(`2026-${String(index + 1).padStart(2, "0")}-10`),
    );

    expect(months).toEqual([
      "10 Jan 2026",
      "10 Feb 2026",
      "10 Mar 2026",
      "10 Apr 2026",
      "10 May 2026",
      "10 Jun 2026",
      "10 Jul 2026",
      "10 Aug 2026",
      "10 Sep 2026",
      "10 Oct 2026",
      "10 Nov 2026",
      "10 Dec 2026",
    ]);
  });

  it("[FAM-UI-05][PRD] a date is a calendar day, so the Melbourne daylight-saving switch (Sun 4 Oct 2026) does not move it", () => {
    expect(formatFundDate("2026-10-03")).toBe("3 Oct 2026");
    expect(formatFundDate("2026-10-04")).toBe("4 Oct 2026");
    expect(formatFundDate("2026-10-05")).toBe("5 Oct 2026");
    // The other switch, back to standard time.
    expect(formatFundDate("2027-04-04")).toBe("4 Apr 2027");
  });

  it("[FAM-UI-05][PRD] handles the ends of the year and a leap day", () => {
    expect(formatFundDate("2026-01-01")).toBe("1 Jan 2026");
    expect(formatFundDate("2026-12-31")).toBe("31 Dec 2026");
    expect(formatFundDate("2028-02-29")).toBe("29 Feb 2028");
  });

  it.each([
    ["not a date"],
    [""],
    ["2026-13-01"],
    ["2026-00-10"],
    ["2026-11-00"],
    ["2026-11-31"],
    ["2026-02-30"],
    ["2027-02-29"],
    ["3/11/2026"],
  ])(
    "[FAM-UI-05][PRD] returns %j unchanged rather than 'Invalid Date' or a day rolled into the next month",
    (input) => {
      expect(formatFundDate(input)).toBe(input);
    },
  );
});

describe("[FAM-UI-05][PRD] formatSignedDollars (FD-04)", () => {
  it.each([
    [6000, "+$6,000"],
    [1000, "+$1,000"],
    [750, "+$750"],
    [-320, "-$320"],
  ])("[FAM-UI-05][AC-02] writes %d as %s", (amount, expected) => {
    expect(formatSignedDollars(amount)).toBe(expected);
  });

  it("[FAM-UI-05][PRD] keeps cents when there are cents, and only then", () => {
    expect(formatSignedDollars(1234.5)).toBe("+$1,234.50");
    expect(formatSignedDollars(-1234.56)).toBe("-$1,234.56");
    expect(formatSignedDollars(1234)).toBe("+$1,234");
    expect(formatSignedDollars(1234567.89)).toBe("+$1,234,567.89");
  });

  it("[FAM-UI-05][PRD] adds up floating-point cents correctly", () => {
    expect(formatSignedDollars(0.1 + 0.2)).toBe("+$0.30");
  });

  it("[FAM-UI-05][PRD] has no sign for nothing: zero and amounts that round to zero are '$0'", () => {
    expect(formatSignedDollars(0)).toBe("$0");
    expect(formatSignedDollars(-0)).toBe("$0");
    expect(formatSignedDollars(0.004)).toBe("$0");
    expect(formatSignedDollars(-0.004)).toBe("$0");
  });

  it("[FAM-UI-05][PRD] never drops digits from a very large amount", () => {
    expect(formatSignedDollars(123456789012.34)).toBe("+$123,456,789,012.34");
  });
});
