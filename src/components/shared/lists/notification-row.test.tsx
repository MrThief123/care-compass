import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NotificationRow } from "./notification-row";

describe("NotificationRow", () => {
  it("[UI-03][AC-05] shows a 'Family' chip for source 'family'", () => {
    render(<NotificationRow source="family" message="Helen Doyle added a new document." />);
    expect(screen.getByText("Family")).toBeInTheDocument();
  });

  it("shows an 'Admin' chip for source 'admin'", () => {
    render(<NotificationRow source="admin" message="New shift assigned." />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });
});
