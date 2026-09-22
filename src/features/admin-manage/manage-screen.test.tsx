import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { ManageScreen } from "./manage-screen";

const data = {
  referenceDate: "2026-11-30",
  staff: [
    { id: "aisha", name: "Aisha Rahman" },
    { id: "daniel", name: "Daniel Kelly" },
  ],
  clients: [
    { id: "margaret", name: "Margaret Doyle" },
    { id: "robert", name: "Robert Hale" },
  ],
  shifts: [
    {
      id: "existing",
      staffId: "aisha",
      clientId: "margaret",
      date: "2026-11-30",
      start: "11:30",
      end: "13:00",
    },
  ],
};

describe("Admin Manage", () => {
  it("[ADM-UI-02][AC-01] selects the initial staff and client and shows the assignment summary", () => {
    render(<ManageScreen data={data} />);
    expect(screen.getByRole("option", { name: "Aisha Rahman" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { name: "Margaret Doyle" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Aisha Rahman → Margaret Doyle")).toBeVisible();
  });
  it("[ADM-UI-02][AC-02] Clear removes both selections", async () => {
    render(<ManageScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryAllByRole("option", { selected: true })).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Assign shift" })).toBeDisabled();
  });
  it("[ADM-UI-02][AC-03] warns on a true overlap but permits assignment", async () => {
    render(<ManageScreen data={data} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "11:00 - 15:00" }));
    expect(screen.getByRole("alert")).toHaveTextContent("11:30 - 13:00");
    expect(screen.getByRole("button", { name: "Assign shift" })).toBeEnabled();
    await userEvent.click(screen.getByRole("option", { name: "Daniel Kelly" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("[ADM-UI-02][AC-04] has no Repeat control", () => {
    render(<ManageScreen data={data} />);
    expect(screen.queryByText(/repeat/i)).not.toBeInTheDocument();
  });
  it("[ADM-UI-02][AC-01] filters each list and handles no results", async () => {
    render(<ManageScreen data={data} />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Search staff" }), "Daniel");
    expect(screen.queryByRole("option", { name: "Aisha Rahman" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Daniel Kelly" })).toBeVisible();
    await userEvent.type(screen.getByRole("searchbox", { name: "Search clients" }), "missing");
    expect(screen.getByText("No clients found")).toBeVisible();
  });
  it("[ADM-UI-02][AC-03] validates custom times and treats touching intervals as non-overlapping", async () => {
    render(<ManageScreen data={data} />);
    await userEvent.click(screen.getByRole("radio", { name: "Custom" }));
    await userEvent.type(screen.getByLabelText("Start time"), "13:00");
    await userEvent.type(screen.getByLabelText("End time"), "11:00");
    await userEvent.click(screen.getByRole("button", { name: "Assign shift" }));
    expect(screen.getByText("End time must be after start time.")).toBeVisible();
    await userEvent.clear(screen.getByLabelText("End time"));
    await userEvent.type(screen.getByLabelText("End time"), "15:00");
    await userEvent.click(screen.getByRole("button", { name: "Assign shift" }));
    expect(screen.getByRole("status")).toHaveTextContent("Shift assigned");
    expect(screen.getByRole("alert")).toHaveTextContent("13:00 - 15:00");
    expect(screen.getByRole("alert")).not.toHaveTextContent("11:30 - 13:00");
  });
  it("[ADM-UI-02][AC-03] resets local assignments on remount", async () => {
    const first = render(<ManageScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Assign shift" }));
    expect(screen.getByRole("alert")).toHaveTextContent("07:00 - 11:00");
    first.unmount();
    render(<ManageScreen data={data} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("[ADM-UI-02][AC-01] supports empty staff and client lists", () => {
    render(<ManageScreen data={{ ...data, staff: [], clients: [] }} />);
    expect(screen.getByText("No staff available")).toBeVisible();
    expect(screen.getByText("No clients available")).toBeVisible();
  });
  it("[ADM-UI-02][AC-01] has no detectable accessibility violations", async () => {
    const { container } = render(<ManageScreen data={data} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
