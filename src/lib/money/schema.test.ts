import { describe, expect, it } from "vitest";

import { moneySchema, positiveMoneySchema } from "./schema";

describe("[F0-12][AC-06] money schema", () => {
  it("[F0-12][AC-06] rejects a decimal string with 3 decimal places", () => {
    expect(positiveMoneySchema.safeParse("12.345").success).toBe(false);
  });

  it.each(["-5", "0", "0.00", "abc", "1e3", "", " ", "12,50", "1.", ".5", "NaN"])(
    "[F0-12][AC-06] rejects %j as a positive amount",
    (value) => {
      expect(positiveMoneySchema.safeParse(value).success).toBe(false);
    },
  );

  it.each(["12", "12.5", "12.50", "0.01", "9999999999.99"])(
    "[F0-12][AC-06] accepts %j as a positive amount",
    (value) => {
      expect(positiveMoneySchema.safeParse(value).success).toBe(true);
    },
  );

  it("[F0-12][AC-06] never accepts a JavaScript number: amounts arrive as strings", () => {
    expect(positiveMoneySchema.safeParse(12.5).success).toBe(false);
  });

  it("[F0-12][AC-06] allows zero for a starting amount, but not negatives or 3 decimals", () => {
    expect(moneySchema.safeParse("0").success).toBe(true);
    expect(moneySchema.safeParse("0.00").success).toBe(true);
    expect(moneySchema.safeParse("-0.01").success).toBe(false);
    expect(moneySchema.safeParse("1.234").success).toBe(false);
  });

  it("[F0-12][AC-06] refuses an amount too large for numeric(12,2)", () => {
    expect(positiveMoneySchema.safeParse("10000000000.00").success).toBe(false);
  });
});
