import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ManageScreen } from "./manage-screen";

/*
 * ADM-07: Assign shift goes through the `assignShift` Server Action. It is replaced here so each
 * test decides what it returns; what it does is covered in src/server/admin/manage-actions.test.ts
 * and tests/integration/admin-assign-shift.test.ts.
 */
const mocks = vi.hoisted(() => ({ assign: vi.fn(), replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: mocks.replace, refresh: vi.fn() }),
  usePathname: () => "/admin/manage",
  useSearchParams: () => new URLSearchParams("staff=aisha&client=margaret"),
}));
vi.mock("@/server/admin/manage-actions", () => ({ assignShift: mocks.assign }));

const selection = { staffId: "aisha", clientId: "margaret" };

/** The shape `getAdminManage` returns from Supabase, names carried on each shift. */
const data = {
  referenceDate: "2026-11-30",
  staff: [
    { id: "aisha", name: "Aisha Rahman" },
    { id: "daniel", name: "Daniel Kelly" },
  ],
  clients: [{ id: "margaret", name: "Margaret Doyle" }],
  shifts: [
    {
      id: "existing",
      staffId: "aisha",
      clientId: "robert",
      date: "2026-12-01",
      start: "11:30",
      end: "13:00",
      staffName: "Aisha Rahman",
      clientName: "Robert Hale",
    },
  ],
};

beforeEach(() => {
  mocks.assign.mockImplementation(
    async (input: {
      carerId: string;
      clientId: string;
      date: string;
      start: string;
      end: string;
    }) => ({
      ok: true,
      data: {
        id: "new-shift",
        staffId: input.carerId,
        clientId: input.clientId,
        date: input.date,
        start: input.start,
        end: input.end,
      },
    }),
  );
});
afterEach(() => vi.resetAllMocks());

const day = (date: string) => screen.getByTestId(`date-picker-day-${date}`);

describe("[ADM-07][AC-01] Assign shift creates the shift through the server", () => {
  it("[ADM-07][AC-01] 1 Dec, 07:00 - 11:00: the action gets exactly that and a dot appears on 1 Dec", async () => {
    render(<ManageScreen data={{ ...data, shifts: [] }} selection={selection} />);
    expect(day("2026-12-01")).toHaveAttribute("data-has-items", "false");

    await userEvent.click(day("2026-12-01"));
    await userEvent.click(screen.getByRole("button", { name: "07:00 - 11:00" }));
    await userEvent.click(screen.getByRole("button", { name: "Assign shift" }));

    expect(mocks.assign).toHaveBeenCalledTimes(1);
    expect(mocks.assign).toHaveBeenCalledWith({
      carerId: "aisha",
      clientId: "margaret",
      date: "2026-12-01",
      start: "07:00",
      end: "11:00",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Shift assigned");
    expect(day("2026-12-01")).toHaveAttribute("data-has-items", "true");
  });

  it("[ADM-07][AC-01] a refused assignment shows the server's message and adds no dot", async () => {
    mocks.assign.mockResolvedValue({
      ok: false,
      error: { code: "UNAUTHORISED", message: "You can't assign this carer to this client." },
    });
    render(<ManageScreen data={{ ...data, shifts: [] }} selection={selection} />);
    await userEvent.click(day("2026-12-01"));
    await userEvent.click(screen.getByRole("button", { name: "Assign shift" }));

    expect(await screen.findByText("You can't assign this carer to this client.")).toBeVisible();
    expect(screen.queryByText(/Shift assigned/)).not.toBeInTheDocument();
    expect(day("2026-12-01")).toHaveAttribute("data-has-items", "false");
  });

  it("[ADM-07][AC-01] a thrown action is a failed assignment, not a crash", async () => {
    mocks.assign.mockRejectedValue(new Error("network"));
    render(<ManageScreen data={{ ...data, shifts: [] }} selection={selection} />);
    await userEvent.click(screen.getByRole("button", { name: "Assign shift" }));

    expect(await screen.findByText("Couldn't assign the shift. Try again.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Assign shift" })).toBeEnabled();
  });
});

describe("[ADM-07][AC-02] soft overlap warning from real shifts", () => {
  it("[ADM-07][AC-02] choosing 11:00 - 15:00 names the 11:30 - 13:00 shift and its client, and Assign stays available", async () => {
    render(<ManageScreen data={data} selection={selection} />);
    await userEvent.click(day("2026-12-01"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "11:00 - 15:00" }));

    // Robert is not in the (searched) client list: the name comes from the shift itself.
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Aisha Rahman already has a shift with Robert Hale from 11:30 - 13:00 that overlaps this time. You can still assign it.",
    );
    const assign = screen.getByRole("button", { name: "Assign shift" });
    expect(assign).toBeEnabled();
    await userEvent.click(assign);
    expect(mocks.assign).toHaveBeenCalledWith(
      expect.objectContaining({ date: "2026-12-01", start: "11:00", end: "15:00" }),
    );
  });
});

describe("[ADM-07][AC-03] custom time validation", () => {
  it("[ADM-07][AC-03] start 12:00 and end 10:00 shows the time error and calls nothing", async () => {
    render(<ManageScreen data={data} selection={selection} />);
    await userEvent.selectOptions(screen.getByLabelText("Start hour"), "12");
    await userEvent.selectOptions(screen.getByLabelText("Start minute"), "00");
    await userEvent.selectOptions(screen.getByLabelText("End hour"), "10");
    await userEvent.selectOptions(screen.getByLabelText("End minute"), "00");
    await userEvent.click(screen.getByRole("button", { name: "Assign shift" }));

    expect(screen.getByText("End time must be after start time.")).toBeVisible();
    expect(mocks.assign).not.toHaveBeenCalled();
  });

  it("[ADM-07][AC-03] a time error returned by the server is shown on the time", async () => {
    mocks.assign.mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Check the shift time.",
        fieldErrors: { end: "End time must be after start time." },
      },
    });
    render(<ManageScreen data={data} selection={selection} />);
    await userEvent.click(screen.getByRole("button", { name: "Assign shift" }));

    expect(await screen.findByText("End time must be after start time.")).toBeVisible();
  });
});

describe("[ADM-07][AC-04] no Repeat control", () => {
  it("[ADM-07][AC-04] the panel has no Repeat control of any kind", async () => {
    const { container } = render(<ManageScreen data={data} selection={selection} />);
    expect(screen.queryByText(/repeat/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /repeat|recur/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: /repeat|recur/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /repeat|recur/i })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
