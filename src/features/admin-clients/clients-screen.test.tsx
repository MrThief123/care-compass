import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClientsScreen } from "./clients-screen";

// ADM-05: Remove now calls the `removeClient` Server Action (feature DECISIONS.md FD-05).
const mocks = vi.hoisted(() => ({ removeClient: vi.fn() }));
vi.mock("@/server/admin/clients-actions", () => ({ removeClient: mocks.removeClient }));
beforeEach(() => {
  mocks.removeClient.mockReset();
  mocks.removeClient.mockImplementation(async (id: string) => ({ ok: true, data: { id } }));
});

const data = {
  clients: [
    { id: "margaret", name: "Margaret Doyle", familyContact: "Helen Doyle" },
    { id: "doris", name: "Doris Petrov", familyContact: "Tom Petrov" },
  ],
};
describe("Admin Clients", () => {
  it("[ADM-04][AC-01] shows client/contact pairs and asks before removing", async () => {
    render(<ClientsScreen data={data} />);
    const row = screen.getByRole("row", { name: /Margaret Doyle/ });
    expect(within(row).getByText("Helen Doyle")).toBeVisible();
    expect(
      within(screen.getByRole("row", { name: /Doris Petrov/ })).getByText("Tom Petrov"),
    ).toBeVisible();
    const remove = within(row).getByRole("button", { name: "Remove Margaret Doyle" });
    await userEvent.click(remove);
    expect(screen.getByRole("dialog", { name: "Remove client?" })).toHaveTextContent(
      "Are you sure you want to remove Margaret Doyle?",
    );
    expect(row).toBeVisible();
  });
  it("[ADM-04][AC-04] has no client editing controls", () => {
    render(<ClientsScreen data={data} />);
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /edit/i })).not.toBeInTheDocument();
  });
  it("[ADM-04][AC-04] has no Add-client panel, button or form field (PD-037/CHG-010)", () => {
    render(<ClientsScreen data={data} />);
    expect(screen.queryByRole("button", { name: /add.*client/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/client name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/family contact/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /add/i })).not.toBeInTheDocument();
  });
  it("[ADM-04][AC-03] handles an empty list", () => {
    render(<ClientsScreen data={{ clients: [] }} />);
    expect(screen.getByText("No clients yet")).toBeVisible();
  });
  it("[ADM-04][PRD] has no detectable accessibility violations", async () => {
    const { container } = render(<ClientsScreen data={data} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

it("[ADM-04][PRD] removes only the confirmed client", async () => {
  render(<ClientsScreen data={data} />);
  await userEvent.click(screen.getByRole("button", { name: "Remove Margaret Doyle" }));
  await userEvent.click(screen.getByRole("button", { name: "Yes, remove" }));
  await waitFor(() =>
    expect(screen.queryByRole("row", { name: /Margaret Doyle/ })).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("row", { name: /Doris Petrov/ })).toBeVisible();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Margaret Doyle removed");
  expect(screen.getByRole("heading", { name: "Client List" })).toHaveFocus();
  expect(data.clients).toHaveLength(2);
});
it("[ADM-04][PRD] Cancel and Escape leave the client unchanged and return focus", async () => {
  render(<ClientsScreen data={data} />);
  const remove = screen.getByRole("button", { name: "Remove Margaret Doyle" });
  await userEvent.click(remove);
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(remove).toHaveFocus();
  await userEvent.click(remove);
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(remove).toHaveFocus();
  expect(screen.getByRole("row", { name: /Margaret Doyle/ })).toBeVisible();
});
it("[ADM-04][AC-03] removes the final client into the empty state", async () => {
  render(<ClientsScreen data={data} />);
  for (const name of ["Margaret Doyle", "Doris Petrov"]) {
    await userEvent.click(screen.getByRole("button", { name: "Remove " + name }));
    await userEvent.click(screen.getByRole("button", { name: "Yes, remove" }));
    await waitFor(() =>
      expect(screen.queryByRole("row", { name: new RegExp(name) })).not.toBeInTheDocument(),
    );
  }
  expect(screen.getByText("No clients yet")).toBeVisible();
});
it("[ADM-04][PRD] omits a visible Remove column heading", () => {
  render(<ClientsScreen data={data} />);
  expect(screen.queryByRole("columnheader", { name: "Remove" })).not.toBeInTheDocument();
});
it("[ADM-04][PRD] confirmation dialog has no detectable accessibility violations", async () => {
  const { container } = render(<ClientsScreen data={data} />);
  await userEvent.click(screen.getByRole("button", { name: "Remove Doris Petrov" }));
  expect(await axe(container)).toHaveNoViolations();
});
