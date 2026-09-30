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

// The full rule is tested in src/lib/phone/au-phone.test.ts; here only how the form uses it.
describe("[ADM-10][AC-08] phone number on the organisation form", () => {
  it("[ADM-10][AC-08] accepts an Australian number", () => {
    expect(phoneError("+61 3 9555 0102")).toBeNull();
  });
  it("[ADM-10][AC-08] refuses the wrong length and letters, each with its own message", () => {
    expect(phoneError("03 9555 010")).toBe(
      "Enter an Australian phone number, like 03 9555 0102 or +61 3 9555 0102.",
    );
    expect(phoneError("03 9555 O102")).toBe(
      "A phone number can only have digits, spaces, + ( ) and -.",
    );
  });
  it("[ADM-10][AC-08] a blank phone is required here and keeps its own message", () => {
    expect(phoneError("   ")).toBe("Enter a phone number.");
  });
});
