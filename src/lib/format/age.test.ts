import { describe, expect, it } from "vitest";

import { ageFromDob } from "./age";

describe("ageFromDob", () => {
  it("computes whole years elapsed as of the reference date", () => {
    expect(ageFromDob("1950-12-05", "2026-11-30")).toBe(75);
  });

  it("counts the birthday as reached on its own date", () => {
    expect(ageFromDob("1950-11-30", "2026-11-30")).toBe(76);
  });
});
