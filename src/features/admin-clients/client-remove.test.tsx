import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClientsScreen } from "./clients-screen";

/*
 * ADM-05: Remove on the Admin client list calls the `removeClient` Server Action. The action is
 * replaced so each test decides what it returns; what it does is covered in
 * src/server/admin/clients-actions.test.ts, supabase/tests/admin_client_remove.test.sql and
 * tests/integration/admin-client-remove.test.ts. The ADM-04 tests in clients-screen.test.tsx that
 * described the local-only preview change with this feature (feature DECISIONS.md FD-05).
 */
const mocks = vi.hoisted(() => ({ removeClient: vi.fn() }));

vi.mock("@/server/admin/clients-actions", () => ({ removeClient: mocks.removeClient }));

const data = {
  clients: [
    { id: "margaret", name: "Margaret Doyle", familyContact: "Helen Doyle" },
    { id: "doris", name: "Doris Petrov", familyContact: "Tom Petrov" },
  ],
};

beforeEach(() => {
  mocks.removeClient.mockImplementation(async (id: string) => ({ ok: true, data: { id } }));
});

afterEach(() => {
  vi.resetAllMocks();
});

async function openRemove(name: string) {
  await userEvent.click(screen.getByRole("button", { name: "Remove " + name }));
  return screen.getByRole("dialog", { name: "Remove client?" });
}

describe("[ADM-05][AC-05] Remove confirmation", () => {
  it("[ADM-05][AC-05] names the client and says staff lose access and the family keeps every record", async () => {
    render(<ClientsScreen data={data} />);

    const dialog = await openRemove("Margaret Doyle");

    expect(dialog).toHaveTextContent("Are you sure you want to remove Margaret Doyle?");
    expect(dialog).toHaveTextContent(/your staff will lose access/i);
    expect(dialog).toHaveTextContent(/family keeps/i);
    expect(dialog).toHaveTextContent(/choose a new organisation/i);
    expect(mocks.removeClient).not.toHaveBeenCalled();
  });

  it("[ADM-05][AC-05] Cancel and Escape call nothing, keep the row and return focus", async () => {
    render(<ClientsScreen data={data} />);
    const remove = screen.getByRole("button", { name: "Remove Margaret Doyle" });

    await openRemove("Margaret Doyle");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(remove).toHaveFocus();

    await userEvent.click(remove);
    await userEvent.keyboard("{Escape}");
    expect(remove).toHaveFocus();

    expect(mocks.removeClient).not.toHaveBeenCalled();
    expect(screen.getByRole("row", { name: /Margaret Doyle/ })).toBeVisible();
  });

  it("[ADM-05][AC-05] Confirm calls removeClient with that client's id, drops only that row and says so", async () => {
    render(<ClientsScreen data={data} />);

    await openRemove("Margaret Doyle");
    await userEvent.click(screen.getByRole("button", { name: "Yes, remove" }));

    await waitFor(() => expect(mocks.removeClient).toHaveBeenCalledExactlyOnceWith("margaret"));
    await waitFor(() =>
      expect(screen.queryByRole("row", { name: /Margaret Doyle/ })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("row", { name: /Doris Petrov/ })).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Margaret Doyle removed");
    expect(status).not.toHaveTextContent(/reload/i);
    expect(screen.getByRole("heading", { name: "Client List" })).toHaveFocus();
  });

  it("[ADM-05][AC-05] removing the last client shows the empty state", async () => {
    render(<ClientsScreen data={{ clients: [data.clients[0]!] }} />);

    await openRemove("Margaret Doyle");
    await userEvent.click(screen.getByRole("button", { name: "Yes, remove" }));

    expect(await screen.findByText("No clients yet")).toBeVisible();
  });

  it("[ADM-05][AC-05] the confirmation has no detectable accessibility violations", async () => {
    const { container } = render(<ClientsScreen data={data} />);
    await openRemove("Doris Petrov");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("[ADM-05][AC-06] a failed removal", () => {
  it("[ADM-05][AC-06] keeps the row, shows an alert and closes the dialog when removeClient fails", async () => {
    mocks.removeClient.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't remove this client. Try again." },
    });
    render(<ClientsScreen data={data} />);

    await openRemove("Margaret Doyle");
    await userEvent.click(screen.getByRole("button", { name: "Yes, remove" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't remove this client");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Margaret Doyle/ })).toBeVisible();
    expect(screen.getByRole("row", { name: /Doris Petrov/ })).toBeVisible();
    expect(screen.queryByText(/Margaret Doyle removed/)).not.toBeInTheDocument();
  });

  it("[ADM-05][AC-06] treats a thrown action the same way, and never says it was removed", async () => {
    mocks.removeClient.mockRejectedValue(new Error("network"));
    render(<ClientsScreen data={data} />);

    await openRemove("Margaret Doyle");
    await userEvent.click(screen.getByRole("button", { name: "Yes, remove" }));

    expect(await screen.findByRole("alert")).toBeVisible();
    const row = screen.getByRole("row", { name: /Margaret Doyle/ });
    expect(within(row).getByRole("button", { name: "Remove Margaret Doyle" })).toBeVisible();
  });
});
