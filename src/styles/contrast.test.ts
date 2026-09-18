import { describe, expect, it } from "vitest";

import { contrastRatio } from "@/lib/contrast";

import { approvedContrastPairs, tokenHex } from "./contrast-pairs";

describe("approved contrast pairs", () => {
  const bodyPairs = approvedContrastPairs.filter((pair) => pair.kind === "body");

  it.each(bodyPairs)(
    "[F0-05][AC-02] $label meets the 4.5:1 body-text minimum",
    ({ foreground, background }) => {
      const ratio = contrastRatio(tokenHex(foreground), tokenHex(background));
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("[F0-05][AC-03] never pairs text/on-dark with bg/brand (#0C9BA9)", () => {
    const forbidden = approvedContrastPairs.some(
      (pair) => pair.foreground === "text/on-dark" && pair.background === "bg/brand",
    );
    expect(forbidden).toBe(false);
  });
});
