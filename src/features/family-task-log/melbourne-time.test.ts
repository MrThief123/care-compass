import { describe, expect, it } from "vitest";

import { formatTimeOfDay, melbourneDateKey } from "./melbourne-time";

describe("formatTimeOfDay (Australia/Melbourne wall clock)", () => {
  it("[FAM-UI-07][AC-04] formats a completion time as HH:mm, e.g. 09:14", () => {
    expect(formatTimeOfDay("2026-11-30T09:14:00+11:00")).toBe("09:14");
  });

  it("[FAM-UI-07][AC-04] converts an instant in UTC to Melbourne time (AEDT, UTC+11, in November)", () => {
    expect(formatTimeOfDay("2026-11-29T22:14:00Z")).toBe("09:14");
  });

  it("[FAM-UI-07][AC-04] uses a 24-hour clock with a leading zero, so just after midnight is 00:05", () => {
    expect(formatTimeOfDay("2026-11-30T00:05:00+11:00")).toBe("00:05");
  });
});

describe("melbourneDateKey", () => {
  it("[FAM-UI-07][AC-01] returns the Melbourne calendar day as YYYY-MM-DD", () => {
    expect(melbourneDateKey("2026-11-30T09:00:00+11:00")).toBe("2026-11-30");
  });

  it("[FAM-UI-07][AC-01] rolls a late-evening UTC instant forward to the next Melbourne day", () => {
    expect(melbourneDateKey("2026-11-29T22:30:00Z")).toBe("2026-11-30");
  });
});
