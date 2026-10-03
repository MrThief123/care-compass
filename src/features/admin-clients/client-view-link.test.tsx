import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ClientsScreen } from "./clients-screen";

/*
 * ADM-11 AC-01: a client's name in Admin · Clients opens that client's Family Home inside the admin
 * layout. Remove (ADM-05) is untouched.
 */
const mocks = vi.hoisted(() => ({ removeClient: vi.fn() }));
vi.mock("@/server/admin/clients-actions", () => ({ removeClient: mocks.removeClient }));

const data = {
  clients: [
    {
      id: "b1111111-1111-1111-1111-111111111111",
      name: "Margaret Doyle",
      familyContact: "Helen Doyle",
    },
    { id: "odd id/with?chars", name: "Doris Petrov", familyContact: "Tom Petrov" },
  ],
};

afterEach(() => vi.resetAllMocks());

describe("[ADM-11][AC-01] client names link to the client view", () => {
  it("[ADM-11][AC-01] each client's name is a link to /admin/clients/<id>/home", () => {
    render(<ClientsScreen data={data} />);

    expect(screen.getByRole("link", { name: "Margaret Doyle" })).toHaveAttribute(
      "href",
      "/admin/clients/b1111111-1111-1111-1111-111111111111/home",
    );
  });

  it("[ADM-11][AC-01] encodes an id that is not path-safe", () => {
    render(<ClientsScreen data={data} />);

    expect(screen.getByRole("link", { name: "Doris Petrov" })).toHaveAttribute(
      "href",
      "/admin/clients/odd%20id%2Fwith%3Fchars/home",
    );
  });

  it("[ADM-11][AC-01] the family contact is not a link", () => {
    render(<ClientsScreen data={data} />);

    expect(screen.queryByRole("link", { name: "Helen Doyle" })).not.toBeInTheDocument();
  });

  it("[ADM-11][AC-01] Remove still opens its confirmation and the row keeps one link", async () => {
    render(<ClientsScreen data={data} />);

    await userEvent.click(screen.getByRole("button", { name: "Remove Margaret Doyle" }));

    const dialog = screen.getByRole("dialog", { name: "Remove client?" });
    expect(within(dialog).getByRole("button", { name: /remove/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
