// @vitest-environment node
import { describe, expect, it } from "vitest";

import { fieldErrors } from "@/components/shared/forms/validation";
import { familyInfoSchema } from "@/features/family-settings/settings-schema";

const VALID = {
  name: "Helen Doyle",
  phone: "0412 345 678",
  email: "helen@example.com",
  address: "12 Wattle St, Preston VIC 3072",
};

describe("[FAM-UI-06][AC-07] familyInfoSchema (FD-03)", () => {
  it("[FAM-UI-06][AC-07] accepts the fixture values", () => {
    expect(fieldErrors(familyInfoSchema, VALID)).toEqual({ ok: true, data: VALID });
  });

  it("[FAM-UI-06][AC-07] allows a blank phone, email and address", () => {
    const result = fieldErrors(familyInfoSchema, { ...VALID, phone: "", email: "", address: "" });

    expect(result.ok).toBe(true);
  });

  it.each(["0412 345 678", "+61 412 345 678", "(03) 9123 4567"])(
    "[FAM-UI-06][AC-07] accepts the phone number %s",
    (phone) => {
      expect(fieldErrors(familyInfoSchema, { ...VALID, phone }).ok).toBe(true);
    },
  );

  it.each(["abc", "123", "0412-345-678x", "1234567890123"])(
    "[FAM-UI-06][AC-07] rejects the phone number %s",
    (phone) => {
      expect(fieldErrors(familyInfoSchema, { ...VALID, phone })).toEqual({
        ok: false,
        errors: { phone: "Enter a phone number like 0412 345 678." },
      });
    },
  );

  it("[FAM-UI-06][AC-07] requires a name, and a blank-looking name counts as blank", () => {
    for (const name of ["", "   "]) {
      expect(fieldErrors(familyInfoSchema, { ...VALID, name })).toEqual({
        ok: false,
        errors: { name: "Enter your name." },
      });
    }
  });

  it("[FAM-UI-06][AC-07] rejects an email that is not an address", () => {
    expect(fieldErrors(familyInfoSchema, { ...VALID, email: "helen@" })).toEqual({
      ok: false,
      errors: { email: "Enter an email address like name@example.com." },
    });
  });

  it("[FAM-UI-06][AC-07] reports every bad field at once", () => {
    const result = fieldErrors(familyInfoSchema, {
      ...VALID,
      name: "",
      email: "helen@",
      phone: "abc",
    });

    expect(result).toEqual({
      ok: false,
      errors: {
        name: "Enter your name.",
        email: "Enter an email address like name@example.com.",
        phone: "Enter a phone number like 0412 345 678.",
      },
    });
  });

  it("[FAM-UI-06][AC-07] trims every value", () => {
    const result = fieldErrors(familyInfoSchema, {
      name: "  Helen Doyle ",
      phone: " 0412 345 678  ",
      email: " helen@example.com ",
      address: "  12 Wattle St, Preston VIC 3072 ",
    });

    expect(result).toEqual({ ok: true, data: VALID });
  });
});
