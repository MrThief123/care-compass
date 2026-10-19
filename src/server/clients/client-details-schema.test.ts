import { afterEach, describe, expect, it, vi } from "vitest";

import { fieldErrors } from "@/components/shared/forms/validation";

import {
  CLIENT_DETAIL_FIELDS,
  ClientDetailsInputSchema,
  hasAnyClientDetail,
} from "./client-details-schema";

/*
 * [F0-28] One schema for the sign-up group, the Settings card and `saveClientDetails` (AC-15).
 * Every field is optional; a blank one means "not set".
 */
afterEach(() => vi.useRealTimers());

const full = {
  dateOfBirth: "1952-03-02",
  email: "margaret@example.com",
  phone: "0400 111 222",
  address: "12 Banksia Street",
  suburb: "Brunswick",
  emergencyContactName: "Helen Doyle",
  emergencyContactRelationship: "Daughter",
  emergencyContactPhone: "+61 400 333 444",
};

describe("[F0-28] ClientDetailsInputSchema", () => {
  it("[F0-28][AC-15] accepts a full set and trims every value", () => {
    const result = fieldErrors(ClientDetailsInputSchema, {
      ...full,
      suburb: "  Brunswick ",
      emergencyContactName: " Helen Doyle",
    });
    expect(result).toEqual({ ok: true, data: full });
  });

  it("[F0-28][AC-02] accepts nothing at all, and blank values mean not set", () => {
    expect(fieldErrors(ClientDetailsInputSchema, {})).toEqual({ ok: true, data: {} });
    const blank = Object.fromEntries(CLIENT_DETAIL_FIELDS.map(({ key }) => [key, "  "]));
    expect(fieldErrors(ClientDetailsInputSchema, blank)).toEqual({ ok: true, data: {} });
  });

  it("[F0-28][AC-04] refuses a date of birth in the future (Melbourne today)", () => {
    vi.useFakeTimers();
    // 14 Oct 2026 23:30 Melbourne is still 14 Oct there, already 14 Oct 12:30 UTC.
    vi.setSystemTime(new Date("2026-10-14T12:30:00.000Z"));
    expect(fieldErrors(ClientDetailsInputSchema, { dateOfBirth: "2026-10-14" }).ok).toBe(true);
    expect(fieldErrors(ClientDetailsInputSchema, { dateOfBirth: "2026-10-15" })).toEqual({
      ok: false,
      errors: { dateOfBirth: "Date of birth can't be in the future." },
    });
  });

  it("[F0-28][AC-04] refuses a date before 1900 and a date that does not exist", () => {
    expect(fieldErrors(ClientDetailsInputSchema, { dateOfBirth: "1899-12-31" })).toEqual({
      ok: false,
      errors: { dateOfBirth: "Date of birth must be in 1900 or later." },
    });
    expect(fieldErrors(ClientDetailsInputSchema, { dateOfBirth: "2001-02-30" })).toEqual({
      ok: false,
      errors: { dateOfBirth: "Enter a real date." },
    });
  });

  it("[F0-28][AC-04] refuses a malformed email and malformed phones", () => {
    const result = fieldErrors(ClientDetailsInputSchema, {
      email: "not-an-email",
      phone: "call me",
      emergencyContactPhone: "12",
    });
    expect(result).toEqual({
      ok: false,
      errors: {
        email: "Enter a valid email address.",
        phone: "Enter a valid phone number.",
        emergencyContactPhone: "Enter a valid phone number.",
      },
    });
  });

  it("[F0-28][AC-09] refuses text over each field's limit", () => {
    const result = fieldErrors(ClientDetailsInputSchema, {
      address: "x".repeat(201),
      suburb: "x".repeat(101),
      emergencyContactName: "x".repeat(101),
      emergencyContactRelationship: "x".repeat(61),
    });
    expect(result).toEqual({
      ok: false,
      errors: {
        address: "Address must be 200 characters or fewer.",
        suburb: "Suburb must be 100 characters or fewer.",
        emergencyContactName: "Emergency contact name must be 100 characters or fewer.",
        emergencyContactRelationship: "Relationship must be 60 characters or fewer.",
      },
    });
  });

  it("[F0-28][AC-01] lists the eight fields in display order with their labels", () => {
    expect(CLIENT_DETAIL_FIELDS.map(({ key, label }) => [key, label])).toEqual([
      ["dateOfBirth", "Date of birth"],
      ["email", "Email"],
      ["phone", "Phone"],
      ["address", "Address"],
      ["suburb", "Suburb"],
      ["emergencyContactName", "Emergency contact name"],
      ["emergencyContactRelationship", "Relationship"],
      ["emergencyContactPhone", "Emergency contact phone"],
    ]);
  });

  it("[F0-28][AC-02] hasAnyClientDetail is false only when nothing is set", () => {
    expect(hasAnyClientDetail({})).toBe(false);
    expect(hasAnyClientDetail({ suburb: "Brunswick" })).toBe(true);
  });
});
