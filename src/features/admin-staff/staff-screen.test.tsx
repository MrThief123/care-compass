import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { StaffMember } from "@/types/domain";

import { StaffScreen } from "./staff-screen";

/*
 * ADM-02 (replacing ADM-UI-03's fixture-only tests, feature DECISIONS.md FD-02): Save now
 * persists through createStaff/updateStaff (PD-038 split Name into First/Last name). These mock
 * the actions directly so the UI's own behaviour — prefill, validation, row update — can be
 * asserted without depending on the mock data source's own state; that round trip is covered
 * separately, against the real mock contract, by staff-actions.test.ts.
 */
const mocks = vi.hoisted(() => ({
  createStaff: vi.fn(),
  updateStaff: vi.fn(),
  resendStaffInvite: vi.fn(),
}));

vi.mock("@/server/admin/staff-actions", () => ({
  createStaff: mocks.createStaff,
  updateStaff: mocks.updateStaff,
  resendStaffInvite: mocks.resendStaffInvite,
}));

function staffMember(overrides: Partial<StaffMember> & Pick<StaffMember, "id">): StaffMember {
  return {
    organisationId: "org-banksia",
    firstName: "",
    lastName: "",
    jobTitle: "Registered Nurse",
    email: "",
    isActive: true,
    ...overrides,
  };
}

const data = {
  roles: ["Registered Nurse", "Enrolled Nurse", "Support Worker"],
  staff: [
    staffMember({
      id: "aisha",
      firstName: "Aisha",
      lastName: "Rahman",
      phone: "0400 000 001",
      email: "aisha.rahman@banksiahomecare.example",
      jobTitle: "Registered Nurse",
    }),
    staffMember({
      id: "daniel",
      firstName: "Daniel",
      lastName: "Kelly",
      phone: "0400 000 002",
      email: "daniel.kelly@banksiahomecare.example",
      jobTitle: "Registered Nurse",
    }),
    staffMember({
      id: "sarah",
      firstName: "Sarah",
      lastName: "Nguyen",
      phone: "0400 000 003",
      email: "sarah.nguyen@banksiahomecare.example",
      jobTitle: "Enrolled Nurse",
    }),
    staffMember({
      id: "marcus",
      firstName: "Marcus",
      lastName: "Chen",
      phone: "0400 000 004",
      email: "marcus.chen@banksiahomecare.example",
      jobTitle: "Support Worker",
    }),
  ],
};

beforeEach(() => {
  mocks.updateStaff.mockImplementation(async (id: string, input) => ({
    ok: true,
    data: staffMember({ id, ...input }),
  }));
  mocks.createStaff.mockImplementation(async (input) => ({
    ok: true,
    data: staffMember({ id: "new-staff", ...input }),
  }));
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("Admin Staff", () => {
  it("[ADM-02][AC-03] shows full staff names and the documented roles", () => {
    render(<StaffScreen data={data} />);
    expect(
      within(screen.getByRole("row", { name: /Sarah Nguyen/ })).getByText("Enrolled Nurse"),
    ).toBeVisible();
    expect(
      within(screen.getByRole("row", { name: /Marcus Chen/ })).getByText("Support Worker"),
    ).toBeVisible();
    expect(screen.getByText("Daniel Kelly")).toBeVisible();
    expect(screen.queryByText("Daniel K.")).not.toBeInTheDocument();
  });
  it("[ADM-02][AC-03] Edit prefills Aisha's full contact details", async () => {
    render(<StaffScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit Aisha Rahman" }));
    expect(screen.getByLabelText("First name")).toHaveValue("Aisha");
    expect(screen.getByLabelText("Last name")).toHaveValue("Rahman");
    expect(screen.getByLabelText("Phone")).toHaveValue("0400 000 001");
    expect(screen.getByLabelText("Email")).toHaveValue("aisha.rahman@banksiahomecare.example");
    expect(screen.getByLabelText("Role")).toHaveValue("Registered Nurse");
  });
  it("[ADM-02][AC-02] Add Staff validates missing email on Save", async () => {
    render(<StaffScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Add Staff" }));
    expect(screen.getByLabelText("First name")).toHaveValue("");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Enter a valid email address.",
    );
    expect(mocks.createStaff).not.toHaveBeenCalled();
  });
  it("[CHG-038] Add Staff refuses a phone that is not an Australian number, and letters", async () => {
    render(<StaffScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Add Staff" }));
    await userEvent.type(screen.getByLabelText("First name"), "Helen");
    await userEvent.type(screen.getByLabelText("Last name"), "Brown");
    await userEvent.type(screen.getByLabelText("Email"), "helen.brown@example.com");
    await userEvent.type(screen.getByLabelText("Phone"), "0395");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByLabelText("Phone")).toHaveAccessibleDescription(
      "Enter an Australian phone number, like 03 9555 0102 or +61 3 9555 0102.",
    );

    await userEvent.clear(screen.getByLabelText("Phone"));
    await userEvent.type(screen.getByLabelText("Phone"), "03 9555 O102");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByLabelText("Phone")).toHaveAccessibleDescription(
      "A phone number can only have digits, spaces, + ( ) and -.",
    );
    expect(mocks.createStaff).not.toHaveBeenCalled();
  });
  it("[CHG-039] Add Staff requires a phone number", async () => {
    render(<StaffScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Add Staff" }));
    await userEvent.type(screen.getByLabelText("First name"), "Helen");
    await userEvent.type(screen.getByLabelText("Last name"), "Brown");
    await userEvent.type(screen.getByLabelText("Email"), "helen.brown@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByLabelText("Phone")).toHaveAccessibleDescription("Enter a phone number.");
    expect(mocks.createStaff).not.toHaveBeenCalled();
  });
  it("[ADM-02][AC-01] Add Staff validates a missing first name on Save", async () => {
    render(<StaffScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Add Staff" }));
    await userEvent.type(screen.getByLabelText("Email"), "helen.brown@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByLabelText("First name")).toHaveAttribute("aria-invalid", "true");
    expect(mocks.createStaff).not.toHaveBeenCalled();
  });
  it("[ADM-02][AC-03] Save calls updateStaff for the selected row and updates it from the result", async () => {
    render(<StaffScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit Sarah Nguyen" }));
    await userEvent.selectOptions(screen.getByLabelText("Role"), "Registered Nurse");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(mocks.updateStaff).toHaveBeenCalledWith(
      "sarah",
      expect.objectContaining({
        firstName: "Sarah",
        lastName: "Nguyen",
        jobTitle: "Registered Nurse",
      }),
    );
    expect(
      await within(screen.getByRole("row", { name: /Sarah Nguyen/ })).findByText(
        "Registered Nurse",
      ),
    ).toBeVisible();
    expect(await screen.findByRole("status")).toHaveTextContent("Sarah Nguyen saved");
  });
  it("[ADM-02][AC-01] calls createStaff with the entered fields and adds the returned row", async () => {
    render(<StaffScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Add Staff" }));
    await userEvent.type(screen.getByLabelText("First name"), "Helen");
    await userEvent.type(screen.getByLabelText("Last name"), "Brown");
    await userEvent.type(screen.getByLabelText("Email"), "helen.brown@example.com");
    await userEvent.type(screen.getByLabelText("Phone"), "0412 345 678");
    await userEvent.selectOptions(screen.getByLabelText("Role"), "Support Worker");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(mocks.createStaff).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Helen",
        lastName: "Brown",
        email: "helen.brown@example.com",
        jobTitle: "Support Worker",
      }),
    );
    expect(await screen.findByRole("row", { name: /Helen Brown/ })).toBeVisible();
  });
  it("[ADM-02][AC-01] a failed save shows the server's message and adds no row", async () => {
    mocks.createStaff.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't save. Please try again." },
    });
    render(<StaffScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Add Staff" }));
    await userEvent.type(screen.getByLabelText("First name"), "Helen");
    await userEvent.type(screen.getByLabelText("Last name"), "Brown");
    await userEvent.type(screen.getByLabelText("Email"), "helen.brown@example.com");
    await userEvent.type(screen.getByLabelText("Phone"), "0412 345 678");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Couldn't save. Please try again.");
    expect(screen.queryByRole("row", { name: /Helen Brown/ })).not.toBeInTheDocument();
  });
  it("[ADM-02][AC-03] shows an empty list and allows adding the first staff member", () => {
    render(<StaffScreen data={{ ...data, staff: [] }} />);
    expect(screen.getByText("No staff yet")).toBeVisible();
    expect(screen.getByRole("button", { name: "Add Staff" })).toBeEnabled();
    expect(screen.queryByLabelText("First name")).not.toBeInTheDocument();
  });
  it("[ADM-02][AC-03] the panel is closed until Add Staff or a name is pressed, and closing clears it", async () => {
    render(<StaffScreen data={data} />);
    expect(screen.queryByLabelText("First name")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Edit Aisha Rahman" }));
    expect(screen.getByLabelText("First name")).toHaveValue("Aisha");
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByLabelText("First name")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Add Staff" }));
    expect(screen.getByLabelText("First name")).toHaveValue("");
  });
  it("[ADM-02][AC-03] editing a different row discards unsaved draft changes", async () => {
    render(<StaffScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit Aisha Rahman" }));
    await userEvent.clear(screen.getByLabelText("First name"));
    await userEvent.type(screen.getByLabelText("First name"), "Unsaved");
    await userEvent.click(screen.getByRole("button", { name: "Edit Marcus Chen" }));
    expect(screen.getByLabelText("First name")).toHaveValue("Marcus");
    expect(screen.getByRole("row", { name: /Aisha Rahman/ })).toBeVisible();
  });
  it("[ADM-02][PRD] has no detectable accessibility violations", async () => {
    const { container } = render(<StaffScreen data={data} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("[ADM-08][FD-07] Pending carers", () => {
  it("[ADM-08][FD-07] labels an invited carer Pending in the list and in their panel", async () => {
    render(<StaffScreen data={{ ...data, pendingIds: [data.staff[2]!.id] }} />);
    expect(
      within(screen.getByRole("row", { name: /Sarah Nguyen/ })).getByText("Pending"),
    ).toBeVisible();
    expect(
      within(screen.getByRole("row", { name: /Aisha Rahman/ })).queryByText("Pending"),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Edit Sarah Nguyen" }));
    expect(screen.getByText("Invite sent. Pending until they sign up.")).toBeVisible();
  });

  it("[ADM-08][FD-07] a carer just added shows as Pending straight away", async () => {
    mocks.createStaff.mockResolvedValue({
      ok: true,
      data: {
        id: "staff-new",
        organisationId: "org-banksia",
        firstName: "Helen",
        lastName: "Brown",
        jobTitle: "Support Worker",
        email: "helen.brown@example.com",
        phone: "0412 345 678",
        isActive: true,
      },
    });
    render(<StaffScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Add Staff" }));
    await userEvent.type(screen.getByLabelText("First name"), "Helen");
    await userEvent.type(screen.getByLabelText("Last name"), "Brown");
    await userEvent.type(screen.getByLabelText("Email"), "helen.brown@example.com");
    await userEvent.type(screen.getByLabelText("Phone"), "0412 345 678");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    const row = await screen.findByRole("row", { name: /Helen Brown/ });
    expect(within(row).getByText("Pending")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Helen Brown invited");
  });
});

describe("[ADM-08][AC-11] keyboard focus around the side panel", () => {
  it("[ADM-08][AC-11] moves focus into the panel on open and back to the opening button on Close or Escape", async () => {
    render(<StaffScreen data={data} />);
    const name = screen.getByRole("button", { name: "Edit Aisha Rahman" });
    await userEvent.click(name);
    expect(screen.getByLabelText("First name")).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(name).toHaveFocus();

    const add = screen.getByRole("button", { name: "Add Staff" });
    await userEvent.click(add);
    expect(screen.getByLabelText("First name")).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(add).toHaveFocus();
  });
});

describe("[F0-24][AC-05] Resend invite in the staff panel (FD-04)", () => {
  it("[F0-24][AC-05] shows Resend invite only for a carer who has not signed in", async () => {
    render(<StaffScreen data={{ ...data, pendingIds: [data.staff[2]!.id] }} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit Sarah Nguyen" }));
    expect(screen.getByRole("button", { name: "Resend invite" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await userEvent.click(screen.getByRole("button", { name: "Edit Aisha Rahman" }));
    expect(screen.queryByRole("button", { name: "Resend invite" })).not.toBeInTheDocument();
  });

  it("[F0-24][AC-05] is absent when adding a new carer", async () => {
    render(<StaffScreen data={{ ...data, pendingIds: [data.staff[2]!.id] }} />);
    await userEvent.click(screen.getByRole("button", { name: "Add Staff" }));
    expect(screen.queryByRole("button", { name: "Resend invite" })).not.toBeInTheDocument();
  });

  it("[F0-24][AC-05] pressing it calls resendStaffInvite and announces success", async () => {
    mocks.resendStaffInvite.mockResolvedValue({ ok: true, data: { id: data.staff[2]!.id } });
    render(<StaffScreen data={{ ...data, pendingIds: [data.staff[2]!.id] }} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit Sarah Nguyen" }));
    await userEvent.click(screen.getByRole("button", { name: "Resend invite" }));
    expect(mocks.resendStaffInvite).toHaveBeenCalledWith(data.staff[2]!.id);
    expect(await screen.findByText("Invite sent again.")).toBeVisible();
  });

  it("[F0-24][AC-05] shows the error message when the resend is refused", async () => {
    mocks.resendStaffInvite.mockResolvedValue({
      ok: false,
      error: { code: "NOT_ALLOWED", message: "Couldn't send the invite. Please try again." },
    });
    render(<StaffScreen data={{ ...data, pendingIds: [data.staff[2]!.id] }} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit Sarah Nguyen" }));
    await userEvent.click(screen.getByRole("button", { name: "Resend invite" }));
    expect(await screen.findByText("Couldn't send the invite. Please try again.")).toBeVisible();
  });
});
