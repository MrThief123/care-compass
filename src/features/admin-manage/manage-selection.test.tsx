import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ManageScreen } from "./manage-screen";

const replace = vi.fn();
let currentParams = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: replace }),
  usePathname: () => "/admin/manage",
  useSearchParams: () => new URLSearchParams(currentParams),
}));

const data = {
  referenceDate: "2026-11-30",
  staff: [
    { id: "aisha", name: "Aisha Rahman" },
    { id: "daniel", name: "Daniel Kelly" },
  ],
  clients: [
    { id: "margaret", name: "Margaret Doyle" },
    { id: "robert", name: "Robert Hale" },
  ],
  shifts: [],
};
const selection = { staffId: "aisha", clientId: "margaret" };

function lastUrl() {
  const call = replace.mock.calls.at(-1);
  if (!call) throw new Error("router.replace was not called");
  const [path, query = ""] = String(call[0]).split("?");
  return { path, params: new URLSearchParams(query) };
}

beforeEach(() => {
  replace.mockReset();
  currentParams = "staff=aisha&client=margaret";
});

describe("[ADM-06] Admin Manage selection", () => {
  it("[ADM-06][AC-01] T-01 shows both selected rows solid with checks and the full-name summary", () => {
    render(<ManageScreen data={data} selection={selection} />);
    for (const name of ["Aisha Rahman", "Margaret Doyle"]) {
      const row = screen.getByRole("option", { name });
      expect(row).toHaveAttribute("aria-selected", "true");
      expect(row.className).toContain("bg-bg-brand-deep");
      expect(row.querySelector("svg")).not.toBeNull();
    }
    expect(screen.getByText("Aisha Rahman → Margaret Doyle")).toBeVisible();
  });

  it("[ADM-06][AC-02] T-02 Clear removes both selections from the URL", async () => {
    render(<ManageScreen data={data} selection={selection} />);
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    const { path, params } = lastUrl();
    expect(path).toBe("/admin/manage");
    expect(params.has("staff")).toBe(false);
    expect(params.has("client")).toBe(false);
  });

  it("[ADM-06][AC-05] T-05 the URL selection is the only selection", () => {
    render(<ManageScreen data={data} selection={{ staffId: "daniel", clientId: "" }} />);
    const selected = within(screen.getByRole("listbox", { name: "Staff" })).getAllByRole("option", {
      selected: true,
    });
    // The row text also holds the avatar initials, so match on the accessible name.
    expect(selected).toEqual([screen.getByRole("option", { name: "Daniel Kelly" })]);
  });

  it("[ADM-06][AC-05] T-05 clicking another staff row changes only the staff param", async () => {
    render(<ManageScreen data={data} selection={selection} />);
    await userEvent.click(screen.getByRole("option", { name: "Daniel Kelly" }));
    const { params } = lastUrl();
    expect(params.get("staff")).toBe("daniel");
    expect(params.get("client")).toBe("margaret");
  });

  it("[ADM-06][AC-05] T-05 clicking another client row changes only the client param", async () => {
    render(<ManageScreen data={data} selection={selection} />);
    await userEvent.click(screen.getByRole("option", { name: "Robert Hale" }));
    const { params } = lastUrl();
    expect(params.get("client")).toBe("robert");
    expect(params.get("staff")).toBe("aisha");
  });

  it("[ADM-06][AC-03] T-06 Enter in Search staff puts staffQ in the URL and keeps the selection", async () => {
    render(<ManageScreen data={data} selection={selection} staffSearch="" clientSearch="" />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Search staff" }), "Sar{Enter}");
    const { params } = lastUrl();
    expect(params.get("staffQ")).toBe("Sar");
    expect(params.get("staff")).toBe("aisha");
    expect(params.get("client")).toBe("margaret");
    expect(params.has("clientQ")).toBe(false);
  });

  it("[ADM-06][AC-03] T-06 Search clients uses clientQ and the box shows the searched text", async () => {
    render(<ManageScreen data={data} selection={selection} staffSearch="Sar" clientSearch="Mar" />);
    expect(screen.getByRole("searchbox", { name: "Search clients" })).toHaveValue("Mar");
    await userEvent.type(screen.getByRole("searchbox", { name: "Search clients" }), "g{Enter}");
    const { params } = lastUrl();
    expect(params.get("clientQ")).toBe("Marg");
  });

  it("[ADM-06][AC-03] T-06 shows a no-results state when the server returns no rows for a search", () => {
    render(
      <ManageScreen
        data={{ ...data, staff: [] }}
        selection={{ staffId: "", clientId: "" }}
        staffSearch="zzz"
      />,
    );
    expect(screen.getByText("No staff found")).toBeVisible();
  });
});
