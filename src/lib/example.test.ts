import { describe, expect, it } from "vitest";

import { capitalize } from "@/lib/example";

describe("capitalize", () => {
  it("uppercases the first character", () => {
    expect(capitalize("care compass")).toBe("Care compass");
  });

  it("returns an empty string unchanged", () => {
    expect(capitalize("")).toBe("");
  });
});
