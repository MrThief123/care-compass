import { describe, expect, it } from "vitest";

import {
  AU_PHONE_FORMAT_MESSAGE,
  AU_PHONE_LETTERS_MESSAGE,
  australianPhoneError,
  isAustralianPhone,
} from "@/lib/phone/au-phone";

/*
 * One Australian phone rule for every settings form (CHG-038): 0X or +61 X, 10 digits (9 after +61),
 * 1300/1800, 13 XX XX; spaces, hyphens and brackets ignored; letters get their own message.
 */
describe("[CHG-038] australianPhoneError", () => {
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
  ])("[CHG-038] accepts %s", (phone) => {
    expect(australianPhoneError(phone)).toBeNull();
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
  ])("[CHG-038] refuses %s (%s) with the format message", (phone) => {
    expect(australianPhoneError(phone)).toBe(AU_PHONE_FORMAT_MESSAGE);
  });

  it.each(["03 9555 O102", "call me", "03 9555 0102 ext 4", "0395550102x"])(
    "[CHG-038] refuses letters in %s with the letters message",
    (phone) => {
      expect(australianPhoneError(phone)).toBe(AU_PHONE_LETTERS_MESSAGE);
    },
  );

  it("[CHG-038] a blank phone keeps its own message", () => {
    expect(phoneError("   ")).toBe("Enter a phone number.");
  });
});
