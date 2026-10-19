import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OnDutyPanel } from "./on-duty-panel";

const SHIFTS = [
  {
    id: "s1",
    carerName: "Aisha Rahman",
    start: "2026-11-30T08:00:00+11:00",
    end: "2026-11-30T12:00:00+11:00",
  },
  {
    id: "s2",
    carerName: "Sarah Nguyen",
    start: "2026-12-01T13:00:00+11:00",
    end: "2026-12-01T17:00:00+11:00",
  },
];

describe("On duty panel", () => {
  it("names the carer on duty on the selected day, with their hours", () => {
    render(<OnDutyPanel dateLabel="Monday 30 November" date="2026-11-30" shifts={SHIFTS} />);
    expect(screen.getByText("Aisha Rahman")).toBeInTheDocument();
    expect(screen.getByText(/8:00\s?am – 12:00\s?pm/i)).toBeInTheDocument();
    expect(screen.queryByText("Sarah Nguyen")).not.toBeInTheDocument();
  });

  it("says so when nobody is on duty that day", () => {
    render(<OnDutyPanel dateLabel="Tuesday 8 December" date="2026-12-08" shifts={SHIFTS} />);
    expect(screen.getByText("No carer on duty")).toBeInTheDocument();
  });
});
