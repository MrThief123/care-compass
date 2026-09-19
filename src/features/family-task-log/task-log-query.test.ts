import { describe, expect, it } from "vitest";

import { DESIGN_TASK_LOG } from "./design-fixtures";
import { filterTaskLog, sortTaskLog } from "./task-log-query";

const titles = (rows: { title: string }[]) => rows.map((row) => row.title);

describe("filterTaskLog", () => {
  it("[FAM-UI-07][AC-01] returns every row for an empty search and All statuses", () => {
    expect(filterTaskLog(DESIGN_TASK_LOG, { query: "", status: "all" })).toHaveLength(9);
  });

  it("[FAM-UI-07][AC-02] keeps only Overdue rows when the status is overdue", () => {
    const result = filterTaskLog(DESIGN_TASK_LOG, { query: "", status: "overdue" });

    expect(titles(result)).toEqual(["Weekly weigh-in", "Medication review"]);
  });

  it("[FAM-UI-07][AC-03] matches the search against the task title, ignoring case and surrounding spaces", () => {
    const result = filterTaskLog(DESIGN_TASK_LOG, { query: "  PHYSIO ", status: "all" });

    expect(titles(result)).toEqual(["Physiotherapy", "Physiotherapy"]);
  });

  it("[FAM-UI-07][AC-03] returns nothing when no title matches", () => {
    expect(filterTaskLog(DESIGN_TASK_LOG, { query: "Zoe", status: "all" })).toEqual([]);
  });

  it("[FAM-UI-07][AC-03] combines the search with the status filter", () => {
    const result = filterTaskLog(DESIGN_TASK_LOG, { query: "physio", status: "planned" });

    expect(result).toHaveLength(1);
    expect(result[0]?.start).toBe("2026-11-30T11:30:00+11:00");
  });
});

describe("sortTaskLog (OQ-31 default: newest first)", () => {
  it("[FAM-UI-07][AC-01] orders the newest Melbourne day first", () => {
    const shuffled = [...DESIGN_TASK_LOG].reverse();

    const dates = sortTaskLog(shuffled).map((row) => row.start.slice(0, 10));

    expect(dates).toEqual([
      "2026-11-30",
      "2026-11-30",
      "2026-11-30",
      "2026-11-29",
      "2026-11-29",
      "2026-11-28",
      "2026-11-28",
      "2026-11-27",
      "2026-11-26",
    ]);
  });

  it("[FAM-UI-07][AC-01] keeps the order the contract returned within a single day", () => {
    const [morning, physio, checkIn] = DESIGN_TASK_LOG;
    if (!morning || !physio || !checkIn) throw new Error("design fixtures changed");

    expect(titles(sortTaskLog([physio, checkIn, morning]))).toEqual([
      "Physiotherapy",
      "Afternoon check-in",
      "Morning medication",
    ]);
  });

  it("[FAM-UI-07][AC-01] does not mutate the array it was given", () => {
    const input = [...DESIGN_TASK_LOG].reverse();
    const snapshot = [...input];

    sortTaskLog(input);

    expect(input).toEqual(snapshot);
  });
});
