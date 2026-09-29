import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { StaffScreen } from "./staff-screen";

const data = {
  roles: ["Registered Nurse", "Enrolled Nurse", "Support Worker"],
  staff: [
    {
      id: "aisha",
      name: "Aisha Rahman",
      phone: "0400 000 001",
      email: "aisha.rahman@banksiahomecare.example",
      role: "Registered Nurse",
    },
    {
      id: "daniel",
      name: "Daniel Kelly",
      phone: "0400 000 002",
      email: "daniel.kelly@banksiahomecare.example",
      role: "Registered Nurse",
    },
    {
      id: "sarah",
      name: "Sarah Nguyen",
      phone: "0400 000 003",
      email: "sarah.nguyen@banksiahomecare.example",
      role: "Enrolled Nurse",
    },
    {
      id: "marcus",
      name: "Marcus Chen",
      phone: "0400 000 004",
      email: "marcus.chen@banksiahomecare.example",
      role: "Support Worker",
    },
  ],
};

describe("Admin Staff", () => {
  it("[ADM-UI-03][AC-01] shows full staff names and the documented roles", () => {
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
  it("[ADM-UI-03][AC-02] Edit prefills Aisha's full contact details", async () => {
    render(<StaffScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit Aisha Rahman" }));
    expect(screen.getByLabelText("Name")).toHaveValue("Aisha Rahman");
    expect(screen.getByLabelText("Phone")).toHaveValue("0400 000 001");
    expect(screen.getByLabelText("Email")).toHaveValue("aisha.rahman@banksiahomecare.example");
    expect(screen.getByLabelText("Role")).toHaveValue("Registered Nurse");
  });
  it("[ADM-UI-03][AC-03] Add Staff validates missing email on Save", async () => {
    render(<StaffScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Add Staff" }));
    expect(screen.getByLabelText("Name")).toHaveValue("");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Enter a valid email address.",
    );
  });
  it("[ADM-UI-03][AC-02] Save updates the selected row locally", async () => {
    render(<StaffScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit Sarah Nguyen" }));
    await userEvent.selectOptions(screen.getByLabelText("Role"), "Registered Nurse");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(
      within(screen.getByRole("row", { name: /Sarah Nguyen/ })).getByText("Registered Nurse"),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Sarah Nguyen saved");
  });
  it("[ADM-UI-03][AC-03] adds a valid full-name record without mutating supplied fixtures", async () => {
    const first = render(<StaffScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Add Staff" }));
    await userEvent.type(screen.getByLabelText("Name"), "Helen Brown");
    await userEvent.type(screen.getByLabelText("Email"), "helen.brown@example.com");
    await userEvent.selectOptions(screen.getByLabelText("Role"), "Support Worker");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("row", { name: /Helen Brown/ })).toBeVisible();
    expect(data.staff).toHaveLength(4);
    first.unmount();
    render(<StaffScreen data={data} />);
    expect(screen.queryByRole("row", { name: /Helen Brown/ })).not.toBeInTheDocument();
  });
  it("[ADM-UI-03][AC-01] shows an empty list and allows adding the first staff member", () => {
    render(<StaffScreen data={{ ...data, staff: [] }} />);
    expect(screen.getByText("No staff yet")).toBeVisible();
    expect(screen.getByRole("button", { name: "Add Staff" })).toBeEnabled();
    expect(screen.getByLabelText("Name")).toHaveValue("");
  });
  it("[ADM-UI-03][AC-02] editing a different row discards unsaved draft changes", async () => {
    render(<StaffScreen data={data} />);
    await userEvent.clear(screen.getByLabelText("Name"));
    await userEvent.type(screen.getByLabelText("Name"), "Unsaved draft");
    await userEvent.click(screen.getByRole("button", { name: "Edit Marcus Chen" }));
    expect(screen.getByLabelText("Name")).toHaveValue("Marcus Chen");
    expect(screen.getByRole("row", { name: /Aisha Rahman/ })).toBeVisible();
  });
  it("[ADM-UI-03][AC-01] has no detectable accessibility violations", async () => {
    const { container } = render(<StaffScreen data={data} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
