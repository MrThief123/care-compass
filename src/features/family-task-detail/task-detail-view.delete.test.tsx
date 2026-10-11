import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getEvent, getOccurrence } from "@/server/events/queries";

import { TaskDetailView } from "./task-detail-view";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const ID = "client-margaret";
const PLANNED_PHYSIO_KEY = "event-margaret-physio:2026-11-30T11:30:00+11:00";
const DONE_MEDS_KEY = "event-margaret-morning-meds:2026-11-30T09:00:00+11:00";

async function renderDetail(key: string, props: { canEdit?: boolean; withEvent?: boolean } = {}) {
  const occurrence = (await getOccurrence(ID, key))!;
  const event = await getEvent(ID, occurrence.eventId);
  return render(
    <TaskDetailView
      clientId={ID}
      occurrence={occurrence}
      documents={[]}
      canEdit={props.canEdit}
      event={props.withEvent === false ? undefined : event}
    />,
  );
}

describe("[FAM-18] Task detail 'Delete event'", () => {
  it("[FAM-18][AC-01] shows beside 'Edit event' for a not-done occurrence", async () => {
    await renderDetail(PLANNED_PHYSIO_KEY);
    expect(screen.getByRole("button", { name: "Delete event" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit event" })).toBeInTheDocument();
  });

  it("[FAM-18][AC-08] is absent on a Done occurrence", async () => {
    await renderDetail(DONE_MEDS_KEY);
    expect(screen.queryByRole("button", { name: "Delete event" })).not.toBeInTheDocument();
  });

  it("[FAM-18][AC-09][AC-16] is absent when the viewer cannot edit (carer off shift, Admin)", async () => {
    await renderDetail(PLANNED_PHYSIO_KEY, { canEdit: false });
    expect(screen.queryByRole("button", { name: "Delete event" })).not.toBeInTheDocument();
  });
});
