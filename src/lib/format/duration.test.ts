import { describe, expect, it } from "vitest";

import { formatDuration } from "./duration";

describe("[UI-00][AC-02] formatDuration", () => {
  it("formats 90 minutes as '1 hr 30 min'", () => {
    expect(formatDuration(90)).toBe("1 hr 30 min");
  });

  it("formats 60 minutes as '1 hr' (omits a zero minutes remainder)", () => {
    expect(formatDuration(60)).toBe("1 hr");
  });

  it("formats sub-hour durations as '<n> min'", () => {
    expect(formatDuration(45)).toBe("45 min");
  });
});
