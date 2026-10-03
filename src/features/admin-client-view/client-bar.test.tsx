import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClientBar } from "./client-bar";

/* ADM-11 AC-01 / AC-02: the bar above a client's Family screens (undesigned, PD-052, FD-05). */
const mocks = vi.hoisted(() => ({ pathname: "/admin/clients/c1/home" }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));

beforeEach(() => {
  mocks.pathname = "/admin/clients/c1/home";
});

describe("[ADM-11][AC-01] client bar", () => {
  it("[ADM-11][AC-01] names the client and links back to the Clients list", () => {
    render(<ClientBar clientId="c1" clientName="Margaret Doyle" />);

    expect(screen.getByText("Margaret Doyle")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to clients" })).toHaveAttribute(
      "href",
      "/admin/clients",
    );
  });

  it("[ADM-11][AC-01] wraps a very long name instead of overflowing", () => {
    const name = "Bartholomew-Maximilian-Featherstonehaugh-Cholmondeley ".repeat(4).trim();
    render(<ClientBar clientId="c1" clientName={name} />);

    const label = screen.getByText(name);
    expect(label.className).toMatch(/overflow-wrap|break-words|truncate|line-clamp/);
  });
});

describe("[ADM-11][AC-02] client nav", () => {
  it("[ADM-11][AC-02] has Home, Info, Calendar, Budget and Care log under the client", () => {
    render(<ClientBar clientId="c1" clientName="Margaret Doyle" />);

    const nav = screen.getByRole("navigation", { name: "Client screens" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Home",
      "Info",
      "Calendar",
      "Budget",
      "Care log",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/admin/clients/c1/home",
      "/admin/clients/c1/info",
      "/admin/clients/c1/calendar",
      "/admin/clients/c1/budget",
      "/admin/clients/c1/tasks",
    ]);
  });

  it("[ADM-11][AC-02] marks the current screen, including a nested one, and only that", () => {
    mocks.pathname = "/admin/clients/c1/budget/edit";
    render(<ClientBar clientId="c1" clientName="Margaret Doyle" />);

    const current = screen.getAllByRole("link", { current: "page" });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Budget");
  });

  it("[ADM-11][AC-02] Task detail counts as Care log", () => {
    mocks.pathname = "/admin/clients/c1/tasks/abc%3A2026";
    render(<ClientBar clientId="c1" clientName="Margaret Doyle" />);

    expect(screen.getByRole("link", { current: "page" })).toHaveTextContent("Care log");
  });

  it("[ADM-11][AC-02] has no accessibility violations", async () => {
    const { container } = render(<ClientBar clientId="c1" clientName="Margaret Doyle" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
