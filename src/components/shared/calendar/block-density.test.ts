import { describe, expect, it } from "vitest";

import { blockDensity } from "./block-density";

describe("[UI-01] blockDensity", () => {
  it("returns compact for a block too short for two lines", () => {
    expect(blockDensity(22)).toBe("compact");
    // A 45-minute event at the default 44px hour row is 33px — one line only.
    expect(blockDensity(33)).toBe("compact");
    expect(blockDensity(39)).toBe("compact");
  });

  it("returns regular once two lines fit", () => {
    // A 60-minute event is exactly one 44px row.
    expect(blockDensity(44)).toBe("regular");
    expect(blockDensity(71)).toBe("regular");
  });

  it("returns full once the whole detail fits", () => {
    // A 2-hour event is 88px.
    expect(blockDensity(72)).toBe("full");
    expect(blockDensity(88)).toBe("full");
  });
});
