import { describe, expect, it } from "vitest";
import { z } from "zod";

import { customTimeRangeSchema, fieldErrors, requiredText } from "./validation";

describe("[UI-02][AC-01] fieldErrors", () => {
  const schema = z.object({
    name: requiredText("Name"),
    email: z.email("Enter a valid email address."),
  });

  it("returns the parsed data when everything is valid", () => {
    const result = fieldErrors(schema, { name: "Helen", email: "helen@example.com" });

    expect(result).toEqual({ ok: true, data: { name: "Helen", email: "helen@example.com" } });
  });

  it("maps issues onto their field names", () => {
    const result = fieldErrors(schema, { name: "", email: "nope" });

    expect(result).toEqual({
      ok: false,
      errors: { name: "Name is required.", email: "Enter a valid email address." },
    });
  });

  it("keeps the first error per field", () => {
    const result = fieldErrors(z.object({ date: requiredText("Date") }), { date: "   " });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.errors.date).toBe("Date is required.");
  });
});

describe("[UI-02][AC-04] customTimeRangeSchema", () => {
  it("accepts an end after the start", () => {
    expect(customTimeRangeSchema.safeParse({ start: "12:00", end: "14:00" }).success).toBe(true);
  });

  it("rejects an end before the start, reporting on the end field", () => {
    const result = fieldErrors(customTimeRangeSchema, { start: "12:00", end: "10:00" });

    expect(result).toEqual({
      ok: false,
      errors: { end: "End time must be after the start time." },
    });
  });

  it("rejects an end equal to the start", () => {
    const result = fieldErrors(customTimeRangeSchema, { start: "12:00", end: "12:00" });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.errors.end).toBe("End time must be after the start time.");
  });

  it("requires both times", () => {
    const result = fieldErrors(customTimeRangeSchema, { start: "", end: "" });

    expect(result.ok).toBe(false);
  });
});
