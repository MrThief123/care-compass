import { describe, expect, it } from "vitest";

import { NO_NURSE, occurrenceNurse } from "./occurrence-display";

describe("occurrenceNurse (OQ-29 / PD-055 nurse rules, PD-038 full names)", () => {
  it("[FAM-UI-07][AC-01] shows the full name of the actor once an occurrence is Done", () => {
    expect(
      occurrenceNurse({ status: "done", actor: "Aisha Rahman", assignee: "Aisha Rahman" }),
    ).toBe("Aisha Rahman");
  });

  it("[FAM-UI-07][AC-01] shows the actor, not the derived assignee, when someone else completed it", () => {
    expect(
      occurrenceNurse({ status: "done", actor: "Sarah Nguyen", assignee: "Aisha Rahman" }),
    ).toBe("Sarah Nguyen");
  });

  it("[FAM-UI-07][AC-01] shows the shift-derived assignee while an occurrence is Planned", () => {
    expect(occurrenceNurse({ status: "planned", assignee: "Aisha Rahman" })).toBe("Aisha Rahman");
  });

  it("[FAM-UI-07][AC-02] shows '—' when no shift covers the occurrence", () => {
    expect(NO_NURSE).toBe("—");
    expect(occurrenceNurse({ status: "overdue" })).toBe("—");
    expect(occurrenceNurse({ status: "planned" })).toBe("—");
  });

  it("[FAM-UI-07][AC-02] falls back to the assignee, then '—', if a Done occurrence has no recorded actor", () => {
    expect(occurrenceNurse({ status: "done", assignee: "Aisha Rahman" })).toBe("Aisha Rahman");
    expect(occurrenceNurse({ status: "done" })).toBe("—");
  });

  it("[FAM-UI-07][AC-01] normalises stray whitespace in names", () => {
    expect(occurrenceNurse({ status: "planned", assignee: "  Daniel   K. " })).toBe("Daniel K.");
  });
});
