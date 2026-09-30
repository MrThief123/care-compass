import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/dev-preview" }));

import DevPreviewPage from "./page";

describe("[F0-19][AC-04] dev-preview showcase", () => {
  it("[F0-19][AC-04] T-04 renders the showcase with its tab links", () => {
    render(<DevPreviewPage />);
    const home = screen.getByRole("link", { name: "Home" });
    expect(home.getAttribute("href")).toBe("/dev-preview");
    expect(screen.getByRole("link", { name: "UI-01" }).getAttribute("href")).toBe(
      "/dev-preview-calendar-kit",
    );
    expect(screen.getByRole("link", { name: "UI-02" }).getAttribute("href")).toBe(
      "/dev-preview-forms-kit",
    );
    expect(screen.getByRole("link", { name: "Database" }).getAttribute("href")).toBe(
      "/dev-preview-database",
    );
  });
});
