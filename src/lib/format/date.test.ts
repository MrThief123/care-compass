import { describe, expect, it } from "vitest";

import { formatLongDate, formatShortDate } from "./date";

describe("[UI-00][AC-03] formatLongDate", () => {
  it("formats 2026-11-30 as 'Monday 30 November 2026'", () => {
    expect(formatLongDate("2026-11-30")).toBe("Monday 30 November 2026");
  });
});

describe("formatShortDate", () => {
  it("formats 2026-11-30 as 'Mon 30 Nov'", () => {
    expect(formatShortDate("2026-11-30")).toBe("Mon 30 Nov");
  });
});
