import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/dev-preview" }));

import DevPreviewPage from "./page";

describe("[F0-19][AC-04] dev-preview showcase", () => {
  it("[F0-19][AC-04] T-04 renders the showcase with its tab links", () => {
    render(<DevPreviewPage />);
    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/dev-preview",
        "/dev-preview-calendar-kit",
        "/dev-preview-forms-kit",
        "/dev-preview-database",
      ]),
    );
    expect(hrefs).not.toContain("/");
  });
});
