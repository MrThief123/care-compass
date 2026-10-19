import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/family/client-margaret/home",
}));

import { RAIL_NAV_ITEMS } from "./nav-config";
import { Rail } from "./rail";

describe("Rail", () => {
  it("has no axe violations", async () => {
    const { container } = render(<Rail role="family" basePath="/family/client-margaret" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[F0-15][AC-02][F0-25][AC-01] Family rail items are exactly Home, Client Details, Documents, Calendar, Budget, Settings in order", () => {
    render(<Rail role="family" basePath="/family/client-margaret" />);
    const labels = within(screen.getByRole("navigation"))
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(labels).toEqual([
      "Home",
      "Client Details",
      "Documents",
      "Calendar",
      "Budget",
      "Settings",
    ]);
  });

  // CHG-059: Info became Client Details, with an ID card icon in place of the info circle.
  it("[F0-15][AC-02] Family Client Details item uses the id-card icon", () => {
    const item = RAIL_NAV_ITEMS.family.find((i) => i.segment === "info");
    expect(item).toEqual({ segment: "info", label: "Client Details", icon: "id-card" });
  });

  // CHG-059: "Client Details" wraps to two lines in the rail, so each line stays centred under its icon.
  it("[F0-15][PRD] centres every rail label, so a two-line label sits under its icon", () => {
    render(<Rail role="family" basePath="/family/client-margaret" />);
    for (const link of within(screen.getByRole("navigation")).getAllByRole("link")) {
      expect(link).toHaveClass("text-center");
    }
  });

  // CHG-059: the Admin Clients item shares the Family Client Details icon.
  it("[F0-15][AC-04] Admin Clients item uses the id-card icon", () => {
    const item = RAIL_NAV_ITEMS.admin.find((i) => i.segment === "clients");
    expect(item?.icon).toBe("id-card");
  });

  // CHG-031: the Carer Calendar merged into Carer Home, so the rail has no Calendar item.
  it("[F0-15][AC-03] Carer rail items are exactly Home, Patients, Settings", () => {
    render(<Rail role="carer" basePath="/carer" />);
    const labels = within(screen.getByRole("navigation"))
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(labels).toEqual(["Home", "Patients", "Settings"]);
  });

  it("[F0-15][AC-04] Admin rail items are exactly Home, Manage, Staff, Clients, Settings", () => {
    render(<Rail role="admin" basePath="/admin" />);
    const labels = within(screen.getByRole("navigation"))
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(labels).toEqual(["Home", "Manage", "Staff", "Clients", "Settings"]);
  });
});
