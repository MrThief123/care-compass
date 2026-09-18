import { describe, expect, it } from "vitest";

import { positionBlocks } from "./position-blocks";

describe("[UI-01][AC-02] positionBlocks", () => {
  it("positions events at 09:00 (60 min) and 11:30 (90 min) from 07:00 with 44px rows", () => {
    const occurrences = [
      { key: "a", start: "2026-11-30T09:00:00+11:00", durationMinutes: 60 },
      { key: "b", start: "2026-11-30T11:30:00+11:00", durationMinutes: 90 },
    ];

    const blocks = positionBlocks(occurrences, { startHour: 7, rowPx: 44 });

    expect(blocks).toEqual([
      { item: occurrences[0], top: 88, height: 44 },
      { item: occurrences[1], top: 198, height: 66 },
    ]);
  });

  it("uses startHour 7 and rowPx 44 as defaults", () => {
    const occurrences = [{ key: "a", start: "2026-11-30T09:00:00+11:00", durationMinutes: 60 }];
    expect(positionBlocks(occurrences)).toEqual([{ item: occurrences[0], top: 88, height: 44 }]);
  });

  it("reads the wall-clock time in Australia/Melbourne regardless of the string's own offset", () => {
    // 2026-11-30T09:00:00+11:00 is 22:00 UTC on 2026-11-29; a naive UTC read would misplace it.
    const occurrences = [{ key: "a", start: "2026-11-29T22:00:00Z", durationMinutes: 30 }];
    expect(positionBlocks(occurrences)).toEqual([{ item: occurrences[0], top: 88, height: 22 }]);
  });
});
