import { describe, expect, it } from "vitest";

import { blockDensity } from "./block-density";

describe("[UI-01] blockDensity", () => {
  it("returns compact for a block too short for two lines", () => {
    expect(blockDensity(22)).toBe("compact");
    expect(blockDensity(29)).toBe("compact");
  });

  it("returns regular once two lines fit", () => {
    expect(blockDensity(30)).toBe("regular");
    expect(blockDensity(55)).toBe("regular");
  });

  it("returns full once the whole detail fits", () => {
    expect(blockDensity(56)).toBe("full");
    expect(blockDensity(180)).toBe("full");
  });
});
