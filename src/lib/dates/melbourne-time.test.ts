// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  instantToMelbourneLocal,
  localToMelbourneIso,
  melbourneDateKey,
} from "@/lib/dates/melbourne-time";

/*
 * F0-11: the recurrence engine works in Melbourne wall-clock time (F0-09) and the database stores
 * instants, so events cross between the two here. `localToMelbourneIso` and `melbourneDateKey` are
 * covered in src/mocks/melbourne-time.test.ts; these are the new direction and the round trip.
 */
describe("[F0-11] instantToMelbourneLocal", () => {
  it.each([
    [
      "an instant written with Melbourne's summer offset",
      "2026-11-30T09:00:00+11:00",
      "2026-11-30T09:00:00",
    ],
    ["the same instant written in UTC", "2026-11-29T22:00:00Z", "2026-11-30T09:00:00"],
    ["the same instant as PostgREST writes it", "2026-11-29T22:00:00+00:00", "2026-11-30T09:00:00"],
    ["fractional seconds, dropped", "2026-11-29T22:00:00.123456+00:00", "2026-11-30T09:00:00"],
    ["a winter instant (+10:00)", "2026-07-01T00:00:00Z", "2026-07-01T10:00:00"],
    ["midnight local", "2026-11-29T13:00:00Z", "2026-11-30T00:00:00"],
    ["the day rolling over from UTC", "2026-12-31T20:30:00Z", "2027-01-01T07:30:00"],
  ])("[F0-11] reads %s", (_label, instant, local) => {
    expect(instantToMelbourneLocal(instant)).toBe(local);
  });

  it("[F0-11] follows daylight saving: the clocks go back at 16:00 UTC on 4 April 2026, from 03:00 AEDT to 02:00 AEST", () => {
    expect(instantToMelbourneLocal("2026-04-04T15:59:59Z")).toBe("2026-04-05T02:59:59");
    expect(instantToMelbourneLocal("2026-04-04T16:00:00Z")).toBe("2026-04-05T02:00:00");
  });

  it("[F0-11] gives the same wall-clock time for the repeated hour when the clocks go back", () => {
    // 02:30 happens twice on 5 April 2026: at 15:30Z (AEDT) and again at 16:30Z (AEST).
    expect(instantToMelbourneLocal("2026-04-04T15:30:00Z")).toBe("2026-04-05T02:30:00");
    expect(instantToMelbourneLocal("2026-04-04T16:30:00Z")).toBe("2026-04-05T02:30:00");
  });

  it("[F0-11] a wall-clock time survives the round trip, in summer and winter", () => {
    for (const local of ["2026-11-30T09:00:00", "2026-07-01T09:00:00", "2027-02-14T23:45:00"]) {
      expect(instantToMelbourneLocal(localToMelbourneIso(local))).toBe(local);
    }
  });

  it("[F0-11] throws for something that is not a date-time", () => {
    expect(() => instantToMelbourneLocal("not a time")).toThrow();
    expect(() => instantToMelbourneLocal("")).toThrow();
  });
});

describe("[F0-11] the helpers the mocks used are unchanged", () => {
  it("[F0-11] localToMelbourneIso and melbourneDateKey still behave as before", () => {
    expect(localToMelbourneIso("2026-11-30T09:00")).toBe("2026-11-30T09:00:00+11:00");
    expect(localToMelbourneIso("2026-07-01T09:00")).toBe("2026-07-01T09:00:00+10:00");
    expect(melbourneDateKey("2026-11-29T22:00:00Z")).toBe("2026-11-30");
  });
});
