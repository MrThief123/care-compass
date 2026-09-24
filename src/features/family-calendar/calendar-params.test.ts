// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  calendarHref,
  parseCalendarParams,
  selectDate,
  stepCalendar,
  switchView,
  visibleRange,
  type CalendarParams,
} from "./calendar-params";

const TODAY = "2026-11-30";

describe("[FAM-UI-02][AC-01] parseCalendarParams", () => {
  it("[FAM-UI-02][AC-01] no params: the week of today, today selected", () => {
    expect(parseCalendarParams({}, TODAY)).toEqual({
      view: "week",
      date: "2026-11-30",
      month: "2026-12",
    });
  });

  it("[FAM-UI-02][AC-01] reads a valid view, date and month", () => {
    expect(
      parseCalendarParams({ view: "month", date: "2026-11-30", month: "2027-01" }, TODAY),
    ).toEqual({ view: "month", date: "2026-11-30", month: "2027-01" });
    expect(parseCalendarParams({ view: "day", date: "2026-12-04" }, TODAY)).toEqual({
      view: "day",
      date: "2026-12-04",
      month: "2026-12",
    });
  });

  it.each([
    ["an unknown view", { view: "year" }],
    ["a repeated view", { view: ["day", "month"] }],
    ["a malformed date", { date: "30-11-2026" }],
    ["an impossible date", { date: "2026-02-30" }],
    ["a date far outside any calendar", { date: "0001-01-01" }],
    ["a malformed month", { month: "2026-13" }],
  ])("[FAM-UI-02][AC-01] ignores %s and falls back to the default", (_label, search) => {
    const parsed = parseCalendarParams(search, TODAY);
    expect(parsed.view).toBe("week");
    expect(parsed.date).toBe("2026-11-30");
    expect(parsed.month).toBe("2026-12");
  });
});

describe("[FAM-UI-02][AC-05] visibleRange", () => {
  it("[FAM-UI-02][AC-01] week: Monday to Sunday of the selected date", () => {
    expect(visibleRange({ view: "week", date: "2026-12-03", month: "2026-12" })).toEqual({
      from: "2026-11-30",
      to: "2026-12-06",
    });
  });

  it("[FAM-UI-02] day: just the selected date", () => {
    expect(visibleRange({ view: "day", date: "2026-12-03", month: "2026-12" })).toEqual({
      from: "2026-12-03",
      to: "2026-12-03",
    });
  });

  it("[FAM-UI-02][AC-05] month: the whole 6×7 grid, leading and trailing days included", () => {
    expect(visibleRange({ view: "month", date: "2026-11-30", month: "2026-12" })).toEqual({
      from: "2026-11-30",
      to: "2027-01-10",
    });
  });
});

describe("[FAM-UI-02][AC-05] switchView", () => {
  const week: CalendarParams = { view: "week", date: "2026-11-30", month: "2026-12" };

  it("[FAM-UI-02][AC-05] week to month opens the month holding most of the week (December), selection kept", () => {
    expect(switchView(week, "month")).toEqual({
      view: "month",
      date: "2026-11-30",
      month: "2026-12",
    });
  });

  it("[FAM-UI-02][AC-05] a week that is mostly November opens November", () => {
    expect(switchView({ ...week, date: "2026-11-24" }, "month").month).toBe("2026-11");
  });

  it("[FAM-UI-02] day and week keep the selected date", () => {
    expect(switchView(week, "day")).toEqual({ ...week, view: "day" });
    expect(switchView({ ...week, view: "month" }, "week")).toEqual(week);
  });
});

describe("[FAM-UI-02] stepCalendar", () => {
  it("[FAM-UI-02] week steps seven days, across a month and a year", () => {
    expect(stepCalendar({ view: "week", date: "2026-11-30", month: "2026-12" }, 1).date).toBe(
      "2026-12-07",
    );
    expect(stepCalendar({ view: "week", date: "2026-12-28", month: "2026-12" }, 1)).toEqual({
      view: "week",
      date: "2027-01-04",
      month: "2027-01",
    });
    expect(stepCalendar({ view: "week", date: "2026-11-30", month: "2026-12" }, -1).date).toBe(
      "2026-11-23",
    );
  });

  it("[FAM-UI-02] day steps one day", () => {
    expect(stepCalendar({ view: "day", date: "2026-11-30", month: "2026-12" }, 1).date).toBe(
      "2026-12-01",
    );
  });

  it("[FAM-UI-02] month steps one month; the selection stays when the new grid still shows it", () => {
    // 30 Nov sits in November's grid as well as December's.
    expect(stepCalendar({ view: "month", date: "2026-11-30", month: "2026-12" }, -1)).toEqual({
      view: "month",
      date: "2026-11-30",
      month: "2026-11",
    });
  });

  it("[FAM-UI-02] month steps one month; otherwise the 1st of the new month is selected", () => {
    expect(stepCalendar({ view: "month", date: "2026-11-30", month: "2026-12" }, 1)).toEqual({
      view: "month",
      date: "2027-01-01",
      month: "2027-01",
    });
  });
});

describe("[FAM-UI-02][AC-03] selectDate", () => {
  it("[FAM-UI-02][AC-03] changes the selected date and nothing else", () => {
    expect(
      selectDate({ view: "week", date: "2026-11-30", month: "2026-12" }, "2026-12-01"),
    ).toEqual({ view: "week", date: "2026-12-01", month: "2026-12" });
  });

  it("[FAM-UI-02] in the month view a leading day does not move the grid", () => {
    expect(
      selectDate({ view: "month", date: "2026-12-10", month: "2026-12" }, "2026-11-30").month,
    ).toBe("2026-12");
  });
});

describe("[FAM-UI-02] calendarHref", () => {
  it("[FAM-UI-02] writes view and date, and month only for the month view", () => {
    expect(
      calendarHref("client-margaret", { view: "week", date: "2026-12-01", month: "2026-12" }),
    ).toBe("/family/client-margaret/calendar?view=week&date=2026-12-01");
    expect(
      calendarHref("client-margaret", { view: "month", date: "2026-11-30", month: "2026-12" }),
    ).toBe("/family/client-margaret/calendar?view=month&date=2026-11-30&month=2026-12");
  });

  it("[FAM-UI-02] encodes the client id", () => {
    expect(calendarHref("a/b", { view: "day", date: "2026-12-01", month: "2026-12" })).toBe(
      "/family/a%2Fb/calendar?view=day&date=2026-12-01",
    );
  });
});
