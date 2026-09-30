import { describe, expect, it } from "vitest";

import { organisationSettingsSchema } from "@/server/admin/settings-schema";

const base = {
  name: "Banksia Home Care",
  abn: "54 123 456 789",
  address: "220 High St, Preston VIC 3072",
};
const phoneError = (phone: string) => {
  const result = organisationSettingsSchema.safeParse({ ...base, phone });
  return result.success ? null : result.error.issues.find((i) => i.path[0] === "phone")?.message;
};

const FORMAT = "Enter an Australian phone number, like 03 9555 0102 or +61 3 9555 0102.";
const LETTERS = "A phone number can only have digits, spaces, + ( ) and -.";

describe("[ADM-10][AC-08] phone number format", () => {
  it.each([
    "03 9555 0102",
    "0395550102",
    "(03) 9555 0102",
    "03-9555-0102",
    "0412 345 678",
    "+61 3 9555 0102",
    "+61395550102",
    "+61 412 345 678",
    "1300 123 456",
    "1800 123 456",
    "13 12 34",
    "  03 9555 0102  ",
  ])("[ADM-10][AC-08] accepts %s", (phone) => {
    expect(phoneError(phone)).toBeNull();
  });

  it.each([
    ["03 9555 010", "one digit short"],
    ["03 9555 01023", "one digit long"],
    ["9555 0102", "no area code"],
    ["01 9555 0102", "0 then a prefix that is not used"],
    ["05 9555 0102", "0 then a prefix that is not used"],
    ["+61 03 9555 0102", "+61 with the leading 0 kept"],
    ["+61 3 9555 010", "+61 too short"],
    ["+44 20 7946 0958", "not Australian"],
    ["0061 3 9555 0102", "00 prefix is not accepted"],
    ["1300 123 45", "1300 too short"],
    ["1900 123 456", "1900 is not accepted"],
    ["+", "just a plus"],
    ["03 9555 0102 +61", "plus in the middle"],
  ])("[ADM-10][AC-08] refuses %s (%s) with the format message", (phone) => {
    expect(phoneError(phone)).toBe(FORMAT);
  });

  it.each(["03 9555 O102", "call me", "03 9555 0102 ext 4", "0395550102x"])(
    "[ADM-10][AC-08] refuses letters in %s with the letters message",
    (phone) => {
      expect(phoneError(phone)).toBe(LETTERS);
    },
  );

  it("[ADM-10][AC-08] a blank phone keeps its own message", () => {
    expect(phoneError("   ")).toBe("Enter a phone number.");
  });
});
