import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CarerAssignment } from "@/server/admin/assignments-queries";
import type { StaffMember } from "@/types/domain";

import { StaffScreen } from "./staff-screen";

/*
 * ADM-08: the Staff screen's per-carer "Clients" list and Remove action. Built from tokens, no
 * design (OQ-19 / PD pattern). `removeCarerAssignment` is replaced so each test decides what it
 * returns; what it does is covered in src/server/admin/assignments-actions.test.ts and
 * tests/integration/admin-carer-assignments.test.ts.
 */
const mocks = vi.hoisted(() => ({
  createStaff: vi.fn(),
  updateStaff: vi.fn(),
  removeCarerAssignment: vi.fn(),
}));

vi.mock("@/server/admin/staff-actions", () => ({
  createStaff: mocks.createStaff,
  updateStaff: mocks.updateStaff,
}));
vi.mock("@/server/admin/assignments-actions", () => ({
  removeCarerAssignment: mocks.removeCarerAssignment,
}));

function carer(id: string, firstName: string, lastName: string): StaffMember {
  return {
    id,
    organisationId: "org-banksia",
    firstName,
    lastName,
    jobTitle: "Registered Nurse",
    email: `${firstName.toLowerCase()}@example.test`,
    isActive: true,
  };
}

const staff = [
  carer("aisha", "Aisha", "Rahman"),
  carer("daniel", "Daniel", "Kelly"),
  carer("sarah", "Sarah", "Nguyen"),
];
const data = { staff, roles: ["Registered Nurse", "Enrolled Nurse", "Support Worker"] };

const assignments: CarerAssignment[] = [
  {
    carerId: "aisha",
    clientId: "margaret",
    clientName: "Margaret Doyle",
    shiftCount: 3,
    nextShift: { date: "2026-12-01", start: "07:00", end: "11:00" },
  },
  {
    carerId: "aisha",
    clientId: "elsie",
    clientName: "Elsie Marsh",
    shiftCount: 1,
    nextShift: { date: "2026-12-03", start: "13:00", end: "17:00" },
  },
  {
    carerId: "daniel",
    clientId: "robert",
    clientName: "Robert Hale",
    shiftCount: 1,
    nextShift: { date: "2026-12-02", start: "09:00", end: "12:00" },
  },
];

const openAisha = () => userEvent.click(screen.getByRole("button", { name: "Edit Aisha Rahman" }));

/** The panel is closed until a name is pressed, so this renders the screen and opens Aisha's. */
async function renderScreen() {
  const view = render(<StaffScreen data={data} assignments={assignments} />);
  await openAisha();
  return view;
}

const clientsList = () => screen.getByRole("region", { name: "Clients for Aisha Rahman" });

beforeEach(() => {
  mocks.removeCarerAssignment.mockResolvedValue({ ok: true, data: { endedShifts: 1 } });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("[ADM-08][AC-04] the carer's Clients list", () => {
  it("[ADM-08][AC-04] shows only the selected carer's clients, by full name, each with a Remove button", async () => {
    await renderScreen();
    const list = clientsList();
    expect(within(list).getByText("Margaret Doyle")).toBeInTheDocument();
    expect(within(list).getByText("Elsie Marsh")).toBeInTheDocument();
    expect(within(list).queryByText("Robert Hale")).not.toBeInTheDocument();
    expect(
      within(list).getByRole("button", { name: "Remove Margaret Doyle from Aisha Rahman" }),
    ).toBeInTheDocument();
  });

  it("[ADM-08][AC-04] switches to another carer's clients when their name is pressed", async () => {
    await renderScreen();
    await userEvent.click(screen.getByRole("button", { name: "Edit Daniel Kelly" }));
    const list = screen.getByRole("region", { name: "Clients for Daniel Kelly" });
    expect(within(list).getByText("Robert Hale")).toBeInTheDocument();
    expect(within(list).queryByText("Margaret Doyle")).not.toBeInTheDocument();
  });

  it("[ADM-08][AC-04] shows an empty state for a carer with no clients", async () => {
    await renderScreen();
    await userEvent.click(screen.getByRole("button", { name: "Edit Sarah Nguyen" }));
    const list = screen.getByRole("region", { name: "Clients for Sarah Nguyen" });
    expect(within(list).getByText("No clients assigned")).toBeInTheDocument();
    expect(within(list).queryByRole("button")).not.toBeInTheDocument();
  });

  it("[ADM-08][AC-04] shows no Clients list until a name is pressed, and none after closing", async () => {
    render(<StaffScreen data={data} assignments={assignments} />);
    expect(screen.queryByRole("region", { name: /^Clients for / })).not.toBeInTheDocument();
    await openAisha();
    expect(clientsList()).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("region", { name: /^Clients for / })).not.toBeInTheDocument();
  });

  it("[ADM-08][AC-04] has no Clients list while adding a new staff member", async () => {
    await renderScreen();
    await userEvent.click(screen.getByRole("button", { name: "Add Staff" }));
    expect(screen.queryByRole("region", { name: /^Clients for / })).not.toBeInTheDocument();
  });

  it("[ADM-08][AC-04] renders with no assignments at all as the empty state, not an error", async () => {
    render(<StaffScreen data={data} />);
    await openAisha();
    expect(
      within(screen.getByRole("region", { name: "Clients for Aisha Rahman" })).getByText(
        "No clients assigned",
      ),
    ).toBeInTheDocument();
  });
});

describe("[ADM-08][AC-05] removing a client from a carer", () => {
  it("[ADM-08][AC-05] asks for confirmation naming both people and does nothing until confirmed", async () => {
    await renderScreen();
    await userEvent.click(
      screen.getByRole("button", { name: "Remove Margaret Doyle from Aisha Rahman" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Remove carer from client?" });
    expect(dialog).toHaveTextContent("Aisha Rahman");
    expect(dialog).toHaveTextContent("Margaret Doyle");
    expect(mocks.removeCarerAssignment).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.removeCarerAssignment).not.toHaveBeenCalled();
    expect(within(clientsList()).getByText("Margaret Doyle")).toBeInTheDocument();
  });

  it("[ADM-08][AC-05] on confirm calls the action for that pair, drops the row and says so", async () => {
    await renderScreen();
    await userEvent.click(
      screen.getByRole("button", { name: "Remove Margaret Doyle from Aisha Rahman" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Yes, remove" }));

    expect(mocks.removeCarerAssignment).toHaveBeenCalledWith({
      carerId: "aisha",
      clientId: "margaret",
    });
    await waitFor(() =>
      expect(within(clientsList()).queryByText("Margaret Doyle")).not.toBeInTheDocument(),
    );
    expect(within(clientsList()).getByText("Elsie Marsh")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Margaret Doyle removed from Aisha Rahman. Their future shifts were cancelled.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("[ADM-08][AC-05] removing the last client leaves the empty state", async () => {
    await renderScreen();
    await userEvent.click(screen.getByRole("button", { name: "Edit Daniel Kelly" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Remove Robert Hale from Daniel Kelly" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Yes, remove" }));
    expect(await screen.findByText("No clients assigned")).toBeInTheDocument();
  });
});

describe("[ADM-08][AC-06] when removing fails", () => {
  it("[ADM-08][AC-06] keeps the row and shows the server's plain-English message", async () => {
    mocks.removeCarerAssignment.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't remove this client. Try again." },
    });
    await renderScreen();
    await userEvent.click(
      screen.getByRole("button", { name: "Remove Margaret Doyle from Aisha Rahman" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Yes, remove" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't remove this client. Try again.",
    );
    expect(within(clientsList()).getByText("Margaret Doyle")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("[ADM-08][AC-07] accessibility", () => {
  it("[ADM-08][AC-07] has no axe violations with the list and the confirmation open", async () => {
    const { container } = await renderScreen();
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(
      screen.getByRole("button", { name: "Remove Margaret Doyle from Aisha Rahman" }),
    );
    // `region` is off: StaffScreen renders alone here, without the admin layout's <main>.
    expect(
      await axe(document.body, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
