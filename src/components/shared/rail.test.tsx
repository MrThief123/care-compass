import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/family/client-margaret/home",
}));

import { Rail } from "./rail";

describe("Rail", () => {
  it("has no axe violations", async () => {
    const { container } = render(<Rail role="family" basePath="/family/client-margaret" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[F0-15][AC-02] Family rail items are exactly Home, Info, Calendar, Budget, Settings in order", () => {
    render(<Rail role="family" basePath="/family/client-margaret" />);
    const labels = within(screen.getByRole("navigation"))
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(labels).toEqual(["Home", "Info", "Calendar", "Budget", "Settings"]);
  });

  it("[F0-15][AC-03] Carer rail items are exactly Home, Patients, Calendar, Settings", () => {
    render(<Rail role="carer" basePath="/carer" />);
    const labels = within(screen.getByRole("navigation"))
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(labels).toEqual(["Home", "Patients", "Calendar", "Settings"]);
  });

  it("[F0-15][AC-04] Admin rail items are exactly Home, Manage, Staff, Clients, Settings", () => {
    render(<Rail role="admin" basePath="/admin" />);
    const labels = within(screen.getByRole("navigation"))
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(labels).toEqual(["Home", "Manage", "Staff", "Clients", "Settings"]);
  });
});
