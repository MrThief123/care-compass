import { describe, expect, it } from "vitest";

import { melbourneDateKey } from "@/mocks/melbourne-time";

describe("[UI-04][AC-01] melbourneDateKey", () => {
  it("[UI-04][AC-01] returns the Melbourne calendar day of an ISO instant", () => {
    expect(melbourneDateKey("2026-11-30T09:00:00+11:00")).toBe("2026-11-30");
    expect(melbourneDateKey("2026-11-30T23:59:00+11:00")).toBe("2026-11-30");
    expect(melbourneDateKey("2026-11-30T00:00:00+11:00")).toBe("2026-11-30");
  });

  it("[UI-04][AC-01] reads a UTC instant in Melbourne time, so late-evening UTC is already the next day", () => {
    // 13:30Z on 30 Nov is 00:30 on 1 Dec in Melbourne (+11:00).
    expect(melbourneDateKey("2026-11-30T13:30:00Z")).toBe("2026-12-01");
    // 22:00Z on 29 Nov is 09:00 on 30 Nov in Melbourne.
    expect(melbourneDateKey("2026-11-29T22:00:00Z")).toBe("2026-11-30");
  });

  it("[UI-04][AC-01] follows daylight saving: +10:00 before 4 Oct 2026, +11:00 after", () => {
    // 14:30Z on 3 Oct is 00:30 on 4 Oct (+10:00), still before the 02:00 change.
    expect(melbourneDateKey("2026-10-03T14:30:00Z")).toBe("2026-10-04");
    // 13:30Z on 3 Oct would be 23:30 on 3 Oct (+10:00).
    expect(melbourneDateKey("2026-10-03T13:30:00Z")).toBe("2026-10-03");
    // 13:30Z on 4 Oct is 00:30 on 5 Oct (+11:00).
    expect(melbourneDateKey("2026-10-04T13:30:00Z")).toBe("2026-10-05");
  });
});
