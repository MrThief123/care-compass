import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { AdminHomeScreen } from "./admin-home-screen";

const data = {
  clientCount: 42,
  staffCount: 17,
  upcomingShifts: [
    {
      id: "shift-margaret",
      clientName: "Margaret",
      carerName: "Aisha Rahman",
      date: "Tue 1 Dec",
      time: "09:00–11:00",
    },
  ],
  overdue: [
    {
      id: "robert-review",
      clientName: "Robert",
      eventTitle: "Medication review",
      nurseName: "Daniel K.",
    },
  ],
};

describe("Admin Home", () => {
  it("[ADM-UI-01][AC-01] shows fixture client and staff totals", () => {
    render(<AdminHomeScreen data={data} />);
    expect(within(screen.getByRole("region", { name: "Clients" })).getByText("42")).toBeVisible();
    expect(within(screen.getByRole("region", { name: "Staff" })).getByText("17")).toBeVisible();
  });
  it("[ADM-UI-01][AC-02] pairs the client, event and nurse in a non-navigating overdue row", () => {
    render(<AdminHomeScreen data={data} />);
    const row = screen.getByRole("listitem");
    for (const text of ["Robert", "Medication review", "Daniel K.", "Overdue"]) {
      expect(within(row).getByText(text)).toBeVisible();
    }
    expect(within(row).queryByRole("link")).not.toBeInTheDocument();
    expect(within(row).queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Across all Clients")).toBeVisible();
  });
  it("[ADM-UI-01][AC-03] shows All caught up for an empty overdue list", () => {
    render(<AdminHomeScreen data={{ ...data, overdue: [] }} />);
    expect(screen.getByText("All caught up")).toBeVisible();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    expect(screen.getByText("42")).toBeVisible();
  });
  it("[ADM-UI-01][AC-01] exposes an accessible loading state without false counts", () => {
    render(<AdminHomeScreen state="loading" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading Admin Home");
    expect(screen.queryByText("42")).not.toBeInTheDocument();
  });
  it("[ADM-UI-01][AC-01] explains a failed load without showing fixture counts", () => {
    render(<AdminHomeScreen state="error" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load Admin Home");
    expect(screen.queryByText("42")).not.toBeInTheDocument();
  });
  it("[ADM-UI-01][AC-02] has no detectable accessibility violations", async () => {
    const { container } = render(<AdminHomeScreen data={data} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

it("[ADM-UI-01][AC-04] shows upcoming shift assignments with client, carer, date and time", () => {
  render(<AdminHomeScreen data={data} />);
  const section = screen.getByRole("region", { name: "Upcoming shifts" });
  for (const header of ["Client", "Carer", "Date", "Time"]) {
    expect(within(section).getByRole("columnheader", { name: header })).toBeVisible();
  }
  const row = within(section).getByRole("row", { name: /Margaret Aisha Rahman/ });
  for (const value of ["Margaret", "Aisha Rahman", "Tue 1 Dec", "09:00–11:00"]) {
    expect(within(row).getByText(value)).toBeVisible();
  }
});

it("[ADM-UI-01][AC-04] explains an empty upcoming shift list", () => {
  render(<AdminHomeScreen data={{ ...data, upcomingShifts: [] }} />);
  expect(screen.getByText("No upcoming shifts")).toBeVisible();
});
