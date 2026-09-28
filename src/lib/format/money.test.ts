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

describe("[F0-12][AC-06] formatMoney with cents", () => {
  it("[F0-12][AC-06] shows cents only when the amount is not whole", () => {
    expect(formatMoney(12.5)).toBe("$12.50");
    expect(formatMoney(1234.05)).toBe("$1,234.05");
    expect(formatMoney(-0.75)).toBe("-$0.75");
    expect(formatMoney(14880)).toBe("$14,880");
    expect(formatMoney(14880.0)).toBe("$14,880");
  });

  it("[F0-12][AC-06] keeps the sign prefix with cents", () => {
    expect(formatMoney(6000.5, { showSign: true })).toBe("+$6,000.50");
  });
});
