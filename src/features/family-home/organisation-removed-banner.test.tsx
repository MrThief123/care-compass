import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { FamilyHomeView } from "./family-home-view";
import { CLIENT_ID, melbourne } from "./test-support";

/*
 * ADM-05 (FD-04, human direction 2026-10-03): Home shows a banner, linking to Settings, when the
 * organisation has removed the client. A banner only: no toast, notification or badge.
 */
const DATA = { today: [], overdue: { items: [], total: 0 }, recent: [], budget: [] };

function renderHome(props: { organisationRemoved?: boolean; firstName?: string } = {}) {
  return render(
    <FamilyHomeView
      clientId={CLIENT_ID}
      data={DATA}
      today={new Date(melbourne("09:00"))}
      clientFirstName="Margaret"
      {...props}
    />,
  );
}

describe("[ADM-05][AC-09] the banner on Home", () => {
  it("[ADM-05][AC-09] says the organisation removed the client and links to Settings", () => {
    renderHome({ organisationRemoved: true });

    const banner = screen.getByRole("region", { name: "Organisation removed" });
    expect(banner).toHaveTextContent(/Your organisation has removed Margaret/);
    expect(banner).toHaveTextContent(/Choose a new organisation/);
    const link = screen.getByRole("link", { name: "Choose organisation" });
    expect(link).toHaveAttribute("href", `/family/${CLIENT_ID}/settings`);
  });

  it("[ADM-05][AC-09] shows no banner when the client has not been removed", () => {
    renderHome({ organisationRemoved: false });
    expect(screen.queryByRole("region", { name: "Organisation removed" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Choose organisation" })).not.toBeInTheDocument();
  });

  it("[ADM-05][AC-09] shows no banner when nothing is said about it (carer Home, older callers)", () => {
    renderHome();
    expect(screen.queryByRole("region", { name: "Organisation removed" })).not.toBeInTheDocument();
  });

  it("[ADM-05][AC-09] creates no toast, alert or badge", () => {
    renderHome({ organisationRemoved: true });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("[ADM-05][AC-09] has no detectable accessibility violations", async () => {
    const { container } = renderHome({ organisationRemoved: true });
    expect(await axe(container)).toHaveNoViolations();
  });
});
