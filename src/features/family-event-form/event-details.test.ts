import { describe, expect, it } from "vitest";

import type { CareEvent } from "@/types/domain";

import {
  EMPTY_EVENT_DETAILS,
  editEventDetailsValues,
  parseEventDetails,
  validateEventDetails,
} from "./event-details";


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

  it("[FAM-16][AC-09] a malformed end time is refused; blank is allowed", () => {
    expect(
      validateEventDetails({ ...EMPTY_EVENT_DETAILS, title: "Walk", endTime: "abc" }).endTime,
    ).toBe("Enter an end time (HH:mm).");
    expect(
      validateEventDetails({ ...EMPTY_EVENT_DETAILS, title: "Walk", endTime: "25:00" }).endTime,
    ).toBe("Enter an end time (HH:mm).");
    expect(validateEventDetails({ ...EMPTY_EVENT_DETAILS, title: "Walk", endTime: "" })).toEqual(
      {},
    );
  });

  it("[FAM-16][AC-09] an end time that is not after the start time is refused", () => {
    const base = { ...EMPTY_EVENT_DETAILS, title: "Walk", startTime: "09:30" };
    expect(validateEventDetails({ ...base, endTime: "09:30" }).endTime).toBe(
      "End time must be after the start time.",
    );
    expect(validateEventDetails({ ...base, endTime: "08:00" }).endTime).toBe(
      "End time must be after the start time.",
    );
    expect(validateEventDetails({ ...base, endTime: "09:31" })).toEqual({});
  });

  it("[FAM-06][AC-01] a valid title, start time and duration pass with no errors", () => {
    expect(
      validateEventDetails({ title: "Physiotherapy", startTime: "09:30", endTime: "10:15" }),
    ).toEqual({});
  });
});

describe("parseEventDetails", () => {
  it("[FAM-06][AC-01] returns the trimmed title, start time and minutes when valid", () => {
    expect(
      parseEventDetails({ title: "  Physiotherapy  ", startTime: "09:30", endTime: "10:15" }),
    ).toEqual({ title: "Physiotherapy", startTime: "09:30", durationMinutes: 45 });
  });

  it("[FAM-16][AC-08] defaults duration to 0 when the end time is left blank", () => {
    expect(parseEventDetails({ title: "Walk", startTime: "09:00", endTime: "" })).toEqual({
      title: "Walk",
      startTime: "09:00",
      durationMinutes: 0,
    });
  });

  it("[FAM-06][AC-02] returns undefined when invalid", () => {
    expect(parseEventDetails({ title: "", startTime: "09:00", endTime: "" })).toBeUndefined();
  });
});

describe("[FAM-16][AC-08] end time becomes minutes", () => {
  it("[FAM-16][AC-08] 09:30 to 10:15 is 45 minutes; 09:00 to 23:59 is 899", () => {
    expect(
      parseEventDetails({ title: "A", startTime: "09:30", endTime: "10:15" })?.durationMinutes,
    ).toBe(45);
    expect(
      parseEventDetails({ title: "A", startTime: "09:00", endTime: "23:59" })?.durationMinutes,
    ).toBe(899);
  });
});

describe("[FAM-16][AC-10] editEventDetailsValues", () => {
  const event = {
    id: "e1",
    title: "Physio",
    start: "2026-11-30T09:30:00+11:00",
    durationMinutes: 45,
  } as CareEvent;

  it("[FAM-16][AC-10] End time is the start plus the duration", () => {
    expect(editEventDetailsValues(event)).toEqual({
      title: "Physio",
      startTime: "09:30",
      endTime: "10:15",
    });
  });

  it("[FAM-16][AC-10] a zero duration leaves End time blank", () => {
    expect(editEventDetailsValues({ ...event, durationMinutes: 0 }).endTime).toBe("");
  });

  it("[FAM-16][AC-10] the viewed occurrence's own start and duration win", () => {
    const values = editEventDetailsValues(event, {
      start: "2026-12-07T14:00:00+11:00",
      durationMinutes: 90,
    } as never);
    expect(values).toMatchObject({ startTime: "14:00", endTime: "15:30" });
  });
});
