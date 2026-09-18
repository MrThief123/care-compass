import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusPill } from "./status-pill";

describe("StatusPill", () => {
  it("[F0-14][AC-01] shows 'Done · <full name>' with a check icon for a done occurrence", () => {
    render(<StatusPill status="done" actorName="Aisha Rahman" />);

    expect(screen.getByText("Done · Aisha Rahman")).toBeInTheDocument();
    expect(screen.getByTestId("icon-check")).toBeInTheDocument();
  });

  it("[F0-14][AC-02] shows 'Overdue' with a warning icon for an overdue occurrence", () => {
    render(<StatusPill status="overdue" />);

    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByTestId("icon-alert-triangle")).toBeInTheDocument();
  });

  it("shows 'Planned' with no icon for a planned occurrence", () => {
    render(<StatusPill status="planned" />);

    expect(screen.getByText("Planned")).toBeInTheDocument();
  });
});
