import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getEvent, getOccurrence } from "@/server/events/queries";

import { TaskDetailView } from "./task-detail-view";

const ID = "client-margaret";
const TASK_KEY = "event-margaret-morning-meds:2026-11-30T09:00:00+11:00";
const PLAIN_KEY = "event-margaret-walk:2026-11-30T14:00:00+11:00";

async function renderDetail(key: string, bucketName?: string, cost?: { cost: number }) {
  const occurrence = (await getOccurrence(ID, key, { type: "all" }))!;
  const base = (await getEvent(ID, occurrence.eventId))!;
  const event = cost ? { ...base, cost: cost.cost, bucketId: "b1" } : base;
  return render(
    <TaskDetailView
      clientId={ID}
      occurrence={occurrence}
      documents={[]}
      event={event}
      bucketName={bucketName}
    />,
  );
}

const details = () => screen.getByRole("region", { name: "Details" });

describe("[FAM-11][FD-08] Task detail Details card", () => {
  it("[FAM-11][FD-08] shows repeat, times and tick-off for a task", async () => {
    await renderDetail(TASK_KEY);

    expect(within(details()).getByText("Repeats")).toBeInTheDocument();
    expect(within(details()).getByText("09:00")).toBeInTheDocument();
    expect(within(details()).getByText("A task: must be ticked off")).toBeInTheDocument();
    expect(within(details()).getByText("No cost")).toBeInTheDocument();
  });

  it("[FAM-11][FD-08] says a plain event needs no tick-off", async () => {
    await renderDetail(PLAIN_KEY);

    expect(within(details()).getByText("Not needed")).toBeInTheDocument();
  });

  it("[FAM-11][FD-08] shows the cost and the bucket that pays it", async () => {
    await renderDetail(TASK_KEY, "NDIS", { cost: 240 });

    expect(within(details()).getByText("$240.00")).toBeInTheDocument();
    expect(within(details()).getByText("NDIS")).toBeInTheDocument();
  });

  it("[FAM-11][FD-08] has no Details card when no event is given", async () => {
    const occurrence = (await getOccurrence(ID, TASK_KEY, { type: "all" }))!;
    render(<TaskDetailView clientId={ID} occurrence={occurrence} documents={[]} />);

    expect(screen.queryByRole("region", { name: "Details" })).not.toBeInTheDocument();
  });
});
