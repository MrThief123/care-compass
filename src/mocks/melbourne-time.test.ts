// @vitest-environment node
import { describe, expect, it } from "vitest";

import { localToMelbourneIso, melbourneDateKey } from "@/mocks/melbourne-time";

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

describe("[UI-04][AC-09] localToMelbourneIso", () => {
  it("[UI-04][AC-09] writes a Melbourne wall-clock time with +11:00 in summer and +10:00 in winter", () => {
    expect(localToMelbourneIso("2026-11-30T09:00")).toBe("2026-11-30T09:00:00+11:00");
    expect(localToMelbourneIso("2026-09-05T11:30")).toBe("2026-09-05T11:30:00+10:00");
  });

  it("[UI-04][AC-09] changes offset at the 4 Oct 2026 spring change: 01:59 is +10:00, 03:00 is +11:00", () => {
    expect(localToMelbourneIso("2026-10-03T12:00")).toBe("2026-10-03T12:00:00+10:00");
    expect(localToMelbourneIso("2026-10-04T01:59:00")).toBe("2026-10-04T01:59:00+10:00");
    expect(localToMelbourneIso("2026-10-04T03:00:00")).toBe("2026-10-04T03:00:00+11:00");
    expect(localToMelbourneIso("2026-10-05T12:00")).toBe("2026-10-05T12:00:00+11:00");
  });

  it("[UI-04][AC-09] changes back at the 4 Apr 2027 autumn change", () => {
    expect(localToMelbourneIso("2027-04-03T12:00")).toBe("2027-04-03T12:00:00+11:00");
    expect(localToMelbourneIso("2027-04-05T12:00")).toBe("2027-04-05T12:00:00+10:00");
  });

  it("[UI-04][AC-09] accepts a local time with or without seconds", () => {
    expect(localToMelbourneIso("2026-11-30T09:00:30")).toBe("2026-11-30T09:00:30+11:00");
    expect(localToMelbourneIso("2026-11-30T09:00")).toBe("2026-11-30T09:00:00+11:00");
  });

  it("[UI-04][AC-09] names the same instant as the local time it was given", () => {
    const iso = localToMelbourneIso("2026-11-30T09:00");

    expect(new Date(iso).toISOString()).toBe("2026-11-29T22:00:00.000Z");
    expect(melbourneDateKey(iso)).toBe("2026-11-30");
  });

  it("[UI-04][AC-09] rejects a malformed value and a time that does not exist in the spring gap", () => {
    expect(() => localToMelbourneIso("garbage")).toThrow(/Invalid local datetime/);
    expect(() => localToMelbourneIso("2026-11-30 09:00")).toThrow(/Invalid local datetime/);
    expect(() => localToMelbourneIso("2026-10-04T02:30:00")).toThrow(/does not exist/);
  });
});
