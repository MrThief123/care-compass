import { describe, expect, it } from "vitest";

import { formatMoney } from "./money";

describe("formatMoney", () => {
  it("formats a plain amount with thousands separators and no decimals", () => {
    expect(formatMoney(14880)).toBe("$14,880");
  });

  it("prefixes a '+' when showSign is set and the amount is positive", () => {
    expect(formatMoney(6000, { showSign: true })).toBe("+$6,000");
  });

  it("prefixes a '-' for negative amounts regardless of showSign", () => {
    expect(formatMoney(-500)).toBe("-$500");
  });
});
