import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ManageScreen } from "./manage-screen";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: replace }),
  usePathname: () => "/admin/manage",
  useSearchParams: () => new URLSearchParams("staff=aisha&client=margaret"),
}));
// ADM-06 FD-02: the URL, not local state, holds the selection, so tests pass it in.
const selection = { staffId: "aisha", clientId: "margaret" };
beforeEach(() => replace.mockReset());

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
    render(<ManageScreen data={data} selection={selection} />);
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
    const view = render(<ManageScreen data={data} selection={selection} />);
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(replace).toHaveBeenCalledWith("/admin/manage", { scroll: false });
    view.rerender(<ManageScreen data={data} />);
    const listed = screen
      .getAllByRole("listbox")
      .flatMap((list) => within(list).queryAllByRole("option"));
    expect(listed.filter((option) => option.getAttribute("aria-selected") === "true")).toHaveLength(
      0,
    );
    expect(screen.getByRole("button", { name: "Assign shift" })).toBeDisabled();
  });
  it("[ADM-UI-02][AC-03] warns on a true overlap but permits assignment", async () => {
    const view = render(<ManageScreen data={data} selection={selection} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "11:00 - 15:00" }));
    expect(screen.getByRole("alert")).toHaveTextContent("11:30 - 13:00");
    expect(screen.getByRole("button", { name: "Assign shift" })).toBeEnabled();
    view.rerender(
      <ManageScreen data={data} selection={{ staffId: "daniel", clientId: "margaret" }} />,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("[ADM-UI-02][AC-04] has no Repeat control", () => {
    render(<ManageScreen data={data} selection={selection} />);
    expect(screen.queryByText(/repeat/i)).not.toBeInTheDocument();
  });
  it("[ADM-UI-02][AC-01] typing does not filter locally and a search with no rows shows no results", async () => {
    // ADM-06 FD-02: filtering is server-side and submitted with Enter (covered by ADM-06 T-06).
    const view = render(<ManageScreen data={data} selection={selection} />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Search staff" }), "Daniel");
    expect(screen.getByRole("option", { name: "Aisha Rahman" })).toBeVisible();
    view.rerender(<ManageScreen data={{ ...data, clients: [] }} clientSearch="missing" />);
    expect(screen.getByText("No clients found")).toBeVisible();
  });
  it("[ADM-UI-02][AC-03] validates the chosen times and treats touching intervals as non-overlapping", async () => {
    render(<ManageScreen data={data} selection={selection} />);
    await userEvent.selectOptions(screen.getByLabelText("Start hour"), "13");
    await userEvent.selectOptions(screen.getByLabelText("Start minute"), "00");
    await userEvent.selectOptions(screen.getByLabelText("End hour"), "11");
    await userEvent.click(screen.getByRole("button", { name: "Assign shift" }));
    expect(screen.getByText("End time must be after start time.")).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("End hour"), "15");
    await userEvent.click(screen.getByRole("button", { name: "Assign shift" }));
    expect(screen.getByRole("status")).toHaveTextContent("Shift assigned");
    // A shift just assigned never warns about itself, and touching intervals do not overlap.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("[ADM-UI-02][AC-03] starts at 07:00 to 11:00 with hour and minute dropdowns for start and end", () => {
    render(<ManageScreen data={data} selection={selection} />);
    expect(screen.getByLabelText("Start hour")).toHaveValue("07");
    expect(screen.getByLabelText("Start minute")).toHaveValue("00");
    expect(screen.getByLabelText("End hour")).toHaveValue("11");
    expect(screen.getByLabelText("End minute")).toHaveValue("00");
    expect(within(screen.getByLabelText("Start hour")).getAllByRole("option")).toHaveLength(24);
    expect(within(screen.getByLabelText("Start minute")).getAllByRole("option")).toHaveLength(12);
  });
  it("[ADM-UI-02][AC-03] a common shift fills the dropdowns and is marked pressed until they change", async () => {
    render(<ManageScreen data={{ ...data, shifts: [] }} selection={selection} />);
    const nineToFive = screen.getByRole("button", { name: "09:00 - 17:00" });
    expect(nineToFive).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(nineToFive);
    expect(screen.getByLabelText("Start hour")).toHaveValue("09");
    expect(screen.getByLabelText("End hour")).toHaveValue("17");
    expect(nineToFive).toHaveAttribute("aria-pressed", "true");
    await userEvent.selectOptions(screen.getByLabelText("End minute"), "30");
    expect(nineToFive).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(screen.getByRole("button", { name: "Assign shift" }));
    expect(screen.getByRole("status")).toHaveTextContent("09:00 - 17:30");
  });
  it("[ADM-UI-02][AC-03] a first assignment shows only the success message, and a repeat warns", async () => {
    render(<ManageScreen data={{ ...data, shifts: [] }} selection={selection} />);
    await userEvent.click(screen.getByRole("button", { name: "Assign shift" }));
    expect(screen.getByRole("status")).toHaveTextContent("Shift assigned");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "11:00 - 15:00" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "07:00 - 11:00" }));
    expect(screen.getByRole("alert")).toHaveTextContent("07:00 - 11:00");
  });
  it("[ADM-UI-02][AC-03] resets local assignments on remount", async () => {
    const first = render(<ManageScreen data={data} selection={selection} />);
    await userEvent.click(screen.getByRole("button", { name: "Assign shift" }));
    expect(screen.getByRole("status")).toHaveTextContent("Shift assigned");
    first.unmount();
    render(<ManageScreen data={data} selection={selection} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("[ADM-UI-02][AC-01] supports empty staff and client lists", () => {
    render(<ManageScreen data={{ ...data, staff: [], clients: [] }} />);
    expect(screen.getByText("No staff available")).toBeVisible();
    expect(screen.getByText("No clients available")).toBeVisible();
  });
  it("[ADM-UI-02][AC-01] has no detectable accessibility violations", async () => {
    const { container } = render(<ManageScreen data={data} selection={selection} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
