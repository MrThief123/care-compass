import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { ClientsScreen } from "./clients-screen";

const data = {
  clients: [
    { id: "margaret", name: "Margaret Doyle", familyContact: "Helen Doyle" },
    { id: "doris", name: "Doris Petrov", familyContact: "Tom Petrov" },
  ],
};
describe("Admin Clients", () => {
  it("[ADM-UI-04][AC-01] shows client/contact pairs and inactive Remove links", async () => {
    render(<ClientsScreen data={data} />);
    const row = screen.getByRole("row", { name: /Margaret Doyle/ });
    expect(within(row).getByText("Helen Doyle")).toBeVisible();
    expect(
      within(screen.getByRole("row", { name: /Doris Petrov/ })).getByText("Tom Petrov"),
    ).toBeVisible();
    const remove = within(row).getByRole("link", { name: "Remove Margaret Doyle" });
    expect(remove).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(remove);
    expect(row).toBeVisible();
  });
  it("[ADM-UI-04][AC-02] reports an empty client name", async () => {
    render(<ClientsScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Add client" }));
    expect(screen.getByLabelText("Client name")).toHaveAccessibleDescription(
      "Enter a client name.",
    );
  });
  it("[ADM-UI-04][AC-03] has no client editing controls", () => {
    render(<ClientsScreen data={data} />);
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /edit/i })).not.toBeInTheDocument();
  });
  it("[ADM-UI-04][AC-02] adds locally and resets on remount without mutating fixtures", async () => {
    const view = render(<ClientsScreen data={data} />);
    await userEvent.type(screen.getByLabelText("Client name"), "Harold Brown");
    await userEvent.type(screen.getByLabelText("Family contact name"), "Grace Brown");
    await userEvent.type(screen.getByLabelText("Family contact email"), "grace@example.com");
    await userEvent.type(screen.getByLabelText("Notes"), "Prefers morning visits");
    await userEvent.click(screen.getByRole("button", { name: "Add client" }));
    expect(screen.getByRole("row", { name: /Harold Brown.*Grace Brown/ })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Harold Brown added");
    expect(data.clients).toHaveLength(2);
    view.unmount();
    render(<ClientsScreen data={data} />);
    expect(screen.queryByText("Harold Brown")).not.toBeInTheDocument();
  });
  it("[ADM-UI-04][AC-02] rejects invalid contact details", async () => {
    render(<ClientsScreen data={data} />);
    await userEvent.type(screen.getByLabelText("Client name"), "Harold");
    await userEvent.type(screen.getByLabelText("Family contact email"), "invalid");
    await userEvent.click(screen.getByRole("button", { name: "Add client" }));
    expect(screen.getByLabelText("Family contact email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Family contact name")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("row", { name: /Harold/ })).not.toBeInTheDocument();
  });
  it("[ADM-UI-04][AC-01] handles an empty list and focuses the add form", async () => {
    render(<ClientsScreen data={{ clients: [] }} />);
    expect(screen.getByText("No clients yet")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Add a new client" }));
    expect(screen.getByLabelText("Client name")).toHaveFocus();
  });
  it("[ADM-UI-04][AC-01] has no detectable accessibility violations", async () => {
    const { container } = render(<ClientsScreen data={data} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
