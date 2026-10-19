// Care Compass - manual unit tests (hand-written)
// Run: npm run test:manual
// Simple checks we wrote ourselves on top of the automated suite.

import { describe, expect, it } from "vitest";

import { validateDocumentFile } from "@/lib/documents/validate-document";
import { ageFromDob } from "@/lib/format/age";
import { displayName } from "@/lib/format/display-name";
import { formatDuration } from "@/lib/format/duration";
import { formatMoney } from "@/lib/format/money";
import { isAustralianPhone, requiredPhoneError } from "@/lib/phone/au-phone";

describe("money", () => {
  it("shows a whole dollar amount", () => {
    expect(formatMoney(50)).toBe("$50");
  });

  it("shows cents", () => {
    expect(formatMoney(12.5)).toBe("$12.50");
  });

  it("shows a big amount", () => {
    expect(formatMoney(1500)).toBe("$1500");
  });

  it("shows a negative amount", () => {
    expect(formatMoney(-40)).toBe("-$40");
  });
});

describe("duration", () => {
  it("shows minutes", () => {
    expect(formatDuration(45)).toBe("45 min");
  });

  it("shows one hour", () => {
    expect(formatDuration(60)).toBe("1 hr");
  });

  it("shows two hours", () => {
    expect(formatDuration(120)).toBe("2 hrs");
  });

  it("shows hours and minutes", () => {
    expect(formatDuration(90)).toBe("1 hr 30 min");
  });
});

describe("names", () => {
  it("removes extra spaces", () => {
    expect(displayName("  Aisha   Rahman ")).toBe("Aisha Rahman");
  });

  it("capitalises the name", () => {
    expect(displayName("aisha rahman")).toBe("Aisha Rahman");
  });
});

describe("age", () => {
  it("works out age after the birthday", () => {
    expect(ageFromDob("1990-03-01T00:00:00+11:00", "2026-10-09T12:00:00+11:00")).toBe(36);
  });

  it("works out age before the birthday", () => {
    expect(ageFromDob("1990-12-25T00:00:00+11:00", "2026-10-09T12:00:00+11:00")).toBe(35);
  });
});

describe("phone numbers", () => {
  it("accepts a landline", () => {
    expect(isAustralianPhone("03 9555 0102")).toBe(true);
  });

  it("accepts a mobile", () => {
    expect(isAustralianPhone("0412 345 678")).toBe(true);
  });

  it("accepts a number starting with 0061", () => {
    expect(isAustralianPhone("0061 3 9555 0102")).toBe(true);
  });

  it("rejects a short number", () => {
    expect(isAustralianPhone("03 9555")).toBe(false);
  });

  it("needs a phone number", () => {
    expect(requiredPhoneError("")).toBe("Enter a phone number.");
  });
});

describe("document uploads", () => {
  it("accepts a PDF", () => {
    const result = validateDocumentFile({
      name: "care-plan.pdf",
      declaredType: "application/pdf",
      size: 1024,
      bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]), // %PDF
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a fake PDF", () => {
    const result = validateDocumentFile({
      name: "fake.pdf",
      declaredType: "application/pdf",
      size: 1024,
      bytes: new Uint8Array([0x4d, 0x5a, 0x90, 0x00]),
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a file that is too big", () => {
    const result = validateDocumentFile({
      name: "huge.pdf",
      declaredType: "application/pdf",
      size: 25 * 1024 * 1024,
      bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    });
    expect(result.ok).toBe(false);
  });
});
