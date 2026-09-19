import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { getTaskLog } from "@/server/events/queries";

import TasksPage from "./page";

function props(clientId: string) {
  return { params: Promise.resolve({ clientId }) };
}

describe("[FAM-UI-07] /family/[clientId]/tasks page (real mock contract, DATA_SOURCE=mock)", () => {
  it("[FAM-UI-07][AC-01] renders the Task log with one row per occurrence getTaskLog returns", async () => {
    const { items } = await getTaskLog("client-margaret");

    render(await TasksPage(props("client-margaret")));

    expect(screen.getByRole("heading", { level: 1, name: "Task log" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(items.length + 1);
    for (const item of items) {
      expect(screen.getAllByRole("link", { name: item.title }).length).toBeGreaterThan(0);
    }
  });

  it("[FAM-UI-07][AC-03] finds nothing for 'Zoe' in the contract's data", async () => {
    const user = userEvent.setup();
    render(await TasksPage(props("client-margaret")));

    await user.type(screen.getByPlaceholderText("Search tasks"), "Zoe");

    expect(screen.getByText('No matches for "Zoe".')).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows the empty state for a client the contract has no occurrences for", async () => {
    render(await TasksPage(props("client-robert")));

    expect(screen.getByText("No tasks yet")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
