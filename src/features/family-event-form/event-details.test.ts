import { describe, expect, it } from "vitest";

import { EMPTY_EVENT_DETAILS, parseEventDetails, validateEventDetails } from "./event-details";

describe("[FAM-06][AC-02] validateEventDetails", () => {
  it("[FAM-06][AC-02] a blank title is refused", () => {
    const errors = validateEventDetails({ ...EMPTY_EVENT_DETAILS, title: "  " });
    expect(errors.title).toBe("Enter a title.");
  });

  it("[FAM-06][AC-02] a blank or malformed start time is refused", () => {
    expect(
      validateEventDetails({ ...EMPTY_EVENT_DETAILS, title: "Walk", startTime: "" }).startTime,
    ).toBe("Enter a start time (HH:mm).");
    expect(
      validateEventDetails({ ...EMPTY_EVENT_DETAILS, title: "Walk", startTime: "25:00" }).startTime,
    ).toBe("Enter a start time (HH:mm).");
  });

  it("[FAM-06][AC-02] a non-numeric duration is refused; blank is allowed", () => {
    expect(
      validateEventDetails({ ...EMPTY_EVENT_DETAILS, title: "Walk", duration: "abc" }).duration,
    ).toBe("Duration must be a whole number of minutes.");
    expect(validateEventDetails({ ...EMPTY_EVENT_DETAILS, title: "Walk", duration: "" })).toEqual(
      {},
    );
  });

  it("[FAM-06][AC-01] a valid title, start time and duration pass with no errors", () => {
    expect(
      validateEventDetails({ title: "Physiotherapy", startTime: "09:30", duration: "45" }),
    ).toEqual({});
  });
});

describe("parseEventDetails", () => {
  it("[FAM-06][AC-01] returns the trimmed title, start time and minutes when valid", () => {
    expect(
      parseEventDetails({ title: "  Physiotherapy  ", startTime: "09:30", duration: "45" }),
    ).toEqual({ title: "Physiotherapy", startTime: "09:30", durationMinutes: 45 });
  });

  it("[FAM-06][AC-01] defaults duration to 0 when left blank", () => {
    expect(parseEventDetails({ title: "Walk", startTime: "09:00", duration: "" })).toEqual({
      title: "Walk",
      startTime: "09:00",
      durationMinutes: 0,
    });
  });

  it("[FAM-06][AC-02] returns undefined when invalid", () => {
    expect(parseEventDetails({ title: "", startTime: "09:00", duration: "" })).toBeUndefined();
  });
});
