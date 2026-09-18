import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Avatar } from "@/components/ui/avatar";

import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("has no axe violations", async () => {
    const { container } = render(
      <PageHeader subject="Home" date="Monday 30 November 2026" userFirstName="Aisha" bell />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[F0-15][AC-01] shows the client as page title with subline, and the signed-in user separately at the right", () => {
    render(
      <PageHeader
        subject={
          <>
            <Avatar name="Margaret" size="lg" />
            <div>
              <p>Margaret</p>
              <p>78 years · Preston VIC · Banksia Home Care</p>
            </div>
          </>
        }
        date="Monday 30 November 2026"
        userFirstName="Helen"
      />,
    );

    expect(screen.getByText("Margaret")).toBeInTheDocument();
    expect(screen.getByText("78 years · Preston VIC · Banksia Home Care")).toBeInTheDocument();
    expect(screen.getByText("Helen")).toBeInTheDocument();
    expect(screen.getByText("Monday 30 November 2026")).toBeInTheDocument();
  });

  it("[F0-15][AC-05] renders no bell button when bell is not set (Family/Admin)", () => {
    render(<PageHeader subject="Home" date="Monday 30 November 2026" userFirstName="Priya" />);
    expect(screen.queryByRole("button", { name: /notification/i })).not.toBeInTheDocument();
  });

  it("[F0-15][AC-05] renders a bell button when bell is set (Carer)", () => {
    render(<PageHeader subject="Home" date="Monday 30 November 2026" userFirstName="Aisha" bell />);
    expect(screen.getByRole("button", { name: /notification/i })).toBeInTheDocument();
  });
});
