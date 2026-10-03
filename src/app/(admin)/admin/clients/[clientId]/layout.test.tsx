import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * ADM-11 AC-05 / AC-01: the client layout checks access before it reads anything else, then draws
 * the client bar above the Family screen. The admin shell around it is the admin layout's job.
 */
const order: string[] = [];
const mocks = vi.hoisted(() => ({
  assertAdminClientAccess: vi.fn(),
  getClientHeaderSummary: vi.fn(),
}));

vi.mock("@/server/admin/client-access", () => ({
  assertAdminClientAccess: mocks.assertAdminClientAccess,
}));
vi.mock("@/server/clients/queries", () => ({
  getClientHeaderSummary: mocks.getClientHeaderSummary,
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/admin/clients/c1/home" }));

import AdminClientLayout from "./layout";

beforeEach(() => {
  order.length = 0;
  mocks.assertAdminClientAccess.mockReset().mockImplementation(async () => {
    order.push("access");
  });
  mocks.getClientHeaderSummary.mockReset().mockImplementation(async () => {
    order.push("header");
    return { id: "c1", firstName: "Margaret", lastName: "Doyle" };
  });
});

async function renderLayout() {
  render(
    await AdminClientLayout({
      children: <p>Family screen</p>,
      params: Promise.resolve({ clientId: "c1" }),
    }),
  );
}

describe("[ADM-11][AC-01] client layout", () => {
  it("[ADM-11][AC-01] shows the client's full name, Back to clients and the screen", async () => {
    await renderLayout();

    expect(screen.getByText("Margaret Doyle")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to clients" })).toBeInTheDocument();
    expect(screen.getByText("Family screen")).toBeInTheDocument();
  });
});

describe("[ADM-11][AC-05] client layout access", () => {
  it("[ADM-11][AC-05] checks access before reading the header", async () => {
    await renderLayout();

    expect(order).toEqual(["access", "header"]);
  });

  it("[ADM-11][AC-05] when the guard shows not-found, no header is read and nothing renders", async () => {
    mocks.assertAdminClientAccess.mockRejectedValue(new Error("NEXT_NOT_FOUND"));

    await expect(renderLayout()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.getClientHeaderSummary).not.toHaveBeenCalled();
  });
});
