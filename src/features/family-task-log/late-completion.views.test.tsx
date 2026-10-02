import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TaskDetailView } from "@/features/family-task-detail/task-detail-view";
import type { Occurrence } from "@/types/domain";

import { TaskLogTable } from "./task-log-table";

const ID = "client-margaret";

function task(overrides: Partial<Occurrence>): Occurrence {
  return {
    key: "event-margaret-morning-meds:2026-11-30T09:00:00+11:00",
    eventId: "event-margaret-morning-meds",
    clientId: ID,
    title: "Morning medication",
    description: "Take with food.",
    start: "2026-11-30T09:00:00+11:00",
    durationMinutes: 15,
    status: "done",
    actor: "Aisha Rahman",
    assignee: "Aisha Rahman",
    completedAt: "2026-12-02T12:00:00+11:00",
    ...overrides,
  };
}

function detail(occurrence: Occurrence) {
  return render(<TaskDetailView clientId={ID} occurrence={occurrence} documents={[]} />);
}

describe("[FAM-16][AC-01] Task detail late note", () => {
  it("[FAM-16][AC-01] a task done two days and three hours late says so beside 'Completed at'", () => {
    detail(task({}));

    const status = screen.getByRole("region", { name: "Status" });
    expect(within(status).getByText("Completed at 12:00")).toBeInTheDocument();
    expect(within(status).getByText("Completed 2 days, 3 hours late")).toBeInTheDocument();
  });

  it("[FAM-16][AC-02] no note when done on time, planned, or overdue", () => {
    const { unmount } = detail(task({ completedAt: "2026-11-30T08:55:00+11:00" }));
    expect(screen.queryByText(/late$/)).not.toBeInTheDocument();
    unmount();

    const planned = detail(task({ status: "planned", completedAt: undefined, actor: undefined }));
    expect(screen.queryByText(/late$/)).not.toBeInTheDocument();
    planned.unmount();

    detail(task({ status: "overdue", completedAt: undefined, actor: undefined }));
    expect(screen.queryByText(/late$/)).not.toBeInTheDocument();
  });
});

describe("[FAM-16][AC-03] Log row late note", () => {
  function table(items: Occurrence[]) {
    return render(
      <TaskLogTable clientId={ID} items={items} params={{ q: "", page: 1 }} onOpen={() => {}} />,
    );
  }

  it("[FAM-16][AC-03] a late Done row shows the note in its status cell; an on-time row does not", () => {
    table([
      task({ key: "a:1", title: "Late one" }),
      task({ key: "b:1", title: "On time", completedAt: "2026-11-30T09:00:00+11:00" }),
    ]);

    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]!).getByText("Completed 2 days, 3 hours late")).toBeInTheDocument();
    expect(within(rows[1]!).queryByText(/late$/)).not.toBeInTheDocument();
  });
});
