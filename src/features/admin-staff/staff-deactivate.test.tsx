import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { StaffMember } from "@/types/domain";

import { StaffScreen } from "./staff-screen";

/*
 * ADM-03: the Deactivate button, its confirmation and the Inactive section on the Staff screen.
 * Built from tokens, no design (OQ-19 / PD-052, FD-04). `deactivateStaff` is replaced so each test
 * decides what it returns; what it does is covered in staff-deactivate-actions.test.ts,
 * supabase/tests/admin_staff_deactivate.test.sql and tests/integration/admin-staff-deactivate.test.ts.
 */
const mocks = vi.hoisted(() => ({
  createStaff: vi.fn(),
  updateStaff: vi.fn(),
  deactivateStaff: vi.fn(),
}));

vi.mock("@/server/admin/staff-actions", () => ({
  createStaff: mocks.createStaff,
  updateStaff: mocks.updateStaff,
  deactivateStaff: mocks.deactivateStaff,
}));
vi.mock("@/server/admin/assignments-actions", () => ({ removeCarerAssignment: vi.fn() }));

function carer(id: string, firstName: string, lastName: string, isActive = true): StaffMember {
  return {
    id,
    organisationId: "org-banksia",
    firstName,
    lastName,
    jobTitle: "Registered Nurse",
    email: `${firstName.toLowerCase()}@example.test`,
    phone: "0400 000 001",
    isActive,
  };
}

const ACTIVE = [carer("aisha", "Aisha", "Rahman"), carer("daniel", "Daniel", "Kelly")];
const INACTIVE = [carer("marcus", "Marcus", "Chen", false)];
const roles = ["Registered Nurse", "Enrolled Nurse", "Support Worker"];

function renderScreen(staff: StaffMember[] = [...ACTIVE, ...INACTIVE]) {
  return render(<StaffScreen data={{ staff, roles }} />);
}

beforeEach(() => {
  mocks.deactivateStaff.mockImplementation(async (id: string) => ({
    ok: true,
    data: { ...ACTIVE.find((person) => person.id === id)!, isActive: false },
  }));
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("[ADM-03][AC-08] Inactive section", () => {
  it("[ADM-03][AC-08] lists active carers in the main list and inactive carers under 'Inactive staff' with a tag", () => {
    renderScreen();
    const inactive = screen.getByRole("region", { name: "Inactive staff" });
    expect(within(inactive).getByText("Marcus Chen")).toBeVisible();
    expect(within(inactive).getByText("Inactive")).toBeVisible();
    expect(within(inactive).queryByText("Aisha Rahman")).not.toBeInTheDocument();
    // The active list is everything outside that section.
    expect(screen.getByRole("button", { name: "Edit Aisha Rahman" })).toBeVisible();
    expect(
      within(inactive).queryByRole("button", { name: "Edit Aisha Rahman" }),
    ).not.toBeInTheDocument();
  });

  it("[ADM-03][AC-08] shows no Inactive section when nobody is inactive", () => {
    renderScreen(ACTIVE);
    expect(screen.queryByRole("region", { name: "Inactive staff" })).not.toBeInTheDocument();
    expect(screen.queryByText("Inactive")).not.toBeInTheDocument();
  });

  it("[ADM-03][AC-08] an inactive carer's name still opens the panel, without a Deactivate button", async () => {
    renderScreen();
    await userEvent.click(screen.getByRole("button", { name: "Edit Marcus Chen" }));
    expect(screen.getByLabelText("First name")).toHaveValue("Marcus");
    expect(screen.queryByRole("button", { name: /^Deactivate/ })).not.toBeInTheDocument();
  });
});

describe("[ADM-03][AC-07] Deactivate with confirmation", () => {
  it("[ADM-03][AC-07] an active carer's panel has a Deactivate button; Add Staff does not", async () => {
    renderScreen();
    await userEvent.click(screen.getByRole("button", { name: "Add Staff" }));
    expect(screen.queryByRole("button", { name: /^Deactivate/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Edit Aisha Rahman" }));
    expect(screen.getByRole("button", { name: "Deactivate Aisha Rahman" })).toBeVisible();
  });

  it("[ADM-03][AC-07] asks first, naming the carer and what happens, and does nothing on Cancel", async () => {
    renderScreen();
    await userEvent.click(screen.getByRole("button", { name: "Edit Aisha Rahman" }));
    await userEvent.click(screen.getByRole("button", { name: "Deactivate Aisha Rahman" }));

    const dialog = screen.getByRole("dialog", { name: "Deactivate staff member?" });
    expect(dialog).toHaveTextContent("Aisha Rahman");
    expect(dialog).toHaveTextContent(/future shifts .* cancelled/i);
    expect(dialog).toHaveTextContent(/records .* kept/i);
    expect(mocks.deactivateStaff).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.deactivateStaff).not.toHaveBeenCalled();
    expect(screen.queryByRole("region", { name: "Inactive staff" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Inactive staff" })).queryByText("Aisha Rahman"),
    ).not.toBeInTheDocument();
  });

  it("[ADM-03][AC-07] on Confirm calls deactivateStaff, says so and moves the carer to Inactive", async () => {
    renderScreen();
    await userEvent.click(screen.getByRole("button", { name: "Edit Aisha Rahman" }));
    await userEvent.click(screen.getByRole("button", { name: "Deactivate Aisha Rahman" }));
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Deactivate" }),
    );

    await waitFor(() => expect(mocks.deactivateStaff).toHaveBeenCalledWith("aisha"));
    expect(mocks.deactivateStaff).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Aisha Rahman deactivated. Their future shifts were cancelled.",
    );
    const inactive = screen.getByRole("region", { name: "Inactive staff" });
    expect(within(inactive).getByText("Aisha Rahman")).toBeVisible();
    expect(within(inactive).getByText("Marcus Chen")).toBeVisible();
    expect(screen.getByRole("button", { name: "Edit Daniel Kelly" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Deactivate Aisha Rahman" }),
    ).not.toBeInTheDocument();
  });

  it("[ADM-03][AC-09] when deactivateStaff fails the carer stays active and an alert says so", async () => {
    mocks.deactivateStaff.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't deactivate. Please try again." },
    });
    renderScreen();
    await userEvent.click(screen.getByRole("button", { name: "Edit Aisha Rahman" }));
    await userEvent.click(screen.getByRole("button", { name: "Deactivate Aisha Rahman" }));
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Deactivate" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't deactivate");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deactivate Aisha Rahman" })).toBeVisible();
    expect(screen.queryByRole("region", { name: "Inactive staff" })).toHaveTextContent(
      "Marcus Chen",
    );
    expect(
      within(screen.getByRole("region", { name: "Inactive staff" })).queryByText("Aisha Rahman"),
    ).not.toBeInTheDocument();
  });
});

describe("[ADM-03][AC-07] accessibility", () => {
  it("[ADM-03][AC-07] has no axe violations with the Inactive section and the confirmation open", async () => {
    renderScreen();
    await userEvent.click(screen.getByRole("button", { name: "Edit Aisha Rahman" }));
    await userEvent.click(screen.getByRole("button", { name: "Deactivate Aisha Rahman" }));
    // `region` is off: StaffScreen renders alone here, without the admin layout's <main>.
    expect(
      await axe(document.body, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
