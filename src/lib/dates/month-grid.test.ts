import { describe, expect, it } from "vitest";

import { monthGrid } from "./month-grid";

describe("[UI-01] monthGrid", () => {
  it("returns 6 Monday-start weeks of 7 days for November 2026", () => {
    const weeks = monthGrid("2026-11-15");

    expect(weeks).toHaveLength(6);
    weeks.forEach((week) => expect(week).toHaveLength(7));
  });

  it("marks days outside the target month as out of month", () => {
    const weeks = monthGrid("2026-11-15");

    expect(weeks[0]![0]).toEqual({ date: "2026-10-26", inMonth: false });
    expect(weeks[0]![6]).toEqual({ date: "2026-11-01", inMonth: true });
    expect(weeks[5]![0]).toEqual({ date: "2026-11-30", inMonth: true });
    expect(weeks[5]![6]).toEqual({ date: "2026-12-06", inMonth: false });
  });

  it("starts every week on Monday", () => {
    const weeks = monthGrid("2026-11-15");
    for (const week of weeks) {
      const [year, month, day] = week[0]!.date.split("-").map(Number);
      const weekday = new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay();
      expect(weekday).toBe(1);
    }
  });
});
