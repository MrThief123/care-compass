import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { taskDetailHref } from "@/features/family-task-log/task-routes";

import TaskDetailPage from "./page";

// FAM-18: Task detail now holds a client 'Delete event' button that calls `useRouter`.
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
}));

const ID = "client-margaret";
const MORNING_MEDICATION_KEY = "event-margaret-morning-meds:2026-11-30T09:00:00+11:00";
const AFTERNOON_WALK_KEY = "event-margaret-walk:2026-11-30T14:00:00+11:00";

function props(clientId: string, key: string, searchParams: Record<string, string> = {}) {
  const occurrenceKey = taskDetailHref(clientId, key).split("/").pop()!;
  return {
    params: Promise.resolve({ clientId, occurrenceKey }),
    searchParams: Promise.resolve(searchParams),
  };
}

describe("[FAM-15] Task detail page (real mock contract, DATA_SOURCE=mock)", () => {
  it("[FAM-15][AC-01] T-01 shows 'Done · Aisha Rahman' and 'Completed at 09:14' for the Morning medication", async () => {
    render(await TaskDetailPage(props(ID, MORNING_MEDICATION_KEY)));

    const status = screen.getByRole("region", { name: "Status" });
    expect(within(status).getByText("Done · Aisha Rahman")).toBeInTheDocument();
    expect(within(status).getByText("Completed at 09:14")).toBeInTheDocument();
  });

  it("[FAM-15][AC-05] T-08 opens a plain event: no 404, 'Event · No tick-off needed', no pill or completion time", async () => {
    render(await TaskDetailPage(props(ID, AFTERNOON_WALK_KEY)));

    expect(screen.getByRole("heading", { level: 1, name: "Afternoon walk" })).toBeInTheDocument();
    const status = screen.getByRole("region", { name: "Status" });
    expect(within(status).getByText("Event · No tick-off needed")).toBeInTheDocument();
    expect(within(status).queryByText(/Planned|Overdue|Done/)).not.toBeInTheDocument();
    expect(within(status).queryByText(/Completed at/)).not.toBeInTheDocument();
  });

  it("[FAM-15][AC-05] T-08 a plain event opened from the Task log keeps 'Back to Task log' (FD-02)", async () => {
    render(await TaskDetailPage(props(ID, AFTERNOON_WALK_KEY, { from: "tasks", page: "2" })));

    expect(screen.getByRole("link", { name: /Back to Task log/ })).toHaveAttribute(
      "href",
      expect.stringContaining("page=2"),
    );
  });

  it("[FAM-15][AC-05] T-08 a plain event key under another client is not found (404)", async () => {
    await expect(TaskDetailPage(props("client-robert", AFTERNOON_WALK_KEY))).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
  });
});
