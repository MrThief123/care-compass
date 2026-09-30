import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { getEventDocuments } from "@/server/documents/queries";
import { getOccurrence } from "@/server/events/queries";

import { TaskDetailView } from "./task-detail-view";

const ID = "client-margaret";
const MORNING_MEDICATION_KEY = "event-margaret-morning-meds:2026-11-30T09:00:00+11:00";
const AFTERNOON_WALK_KEY = "event-margaret-walk:2026-11-30T14:00:00+11:00";

async function renderDetail(key: string) {
  const occurrence = (await getOccurrence(ID, key, { type: "all" }))!;
  const documents = await getEventDocuments(ID, occurrence.eventId);
  return render(<TaskDetailView clientId={ID} occurrence={occurrence} documents={documents} />);
}

describe("[FAM-15] TaskDetailView", () => {
  it("[FAM-15][AC-02] T-03 the subline reads 'Monday 30 November 2026 · Assigned to Aisha Rahman'", async () => {
    await renderDetail(MORNING_MEDICATION_KEY);

    expect(
      screen.getByText("Monday 30 November 2026 · Assigned to Aisha Rahman"),
    ).toBeInTheDocument();
  });

  it("[FAM-15][AC-05] T-07 a plain event's Status card reads 'Event · No tick-off needed', with no pill and no completion time", async () => {
    await renderDetail(AFTERNOON_WALK_KEY);

    const status = screen.getByRole("region", { name: "Status" });
    expect(within(status).getByText("Event · No tick-off needed")).toBeInTheDocument();
    expect(within(status).queryByText(/Planned|Overdue|Done/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Completed at/)).not.toBeInTheDocument();
  });

  it("[FAM-15][AC-05] T-07 a plain event still has its title, date line, Edit event button and Description and Documents cards", async () => {
    await renderDetail(AFTERNOON_WALK_KEY);

    expect(screen.getByRole("heading", { level: 1, name: "Afternoon walk" })).toBeInTheDocument();
    expect(screen.getByText(/^Monday 30 November 2026 · Assigned to /)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit event" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Description" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Documents" })).toBeInTheDocument();
  });

  it("[FAM-15][AC-05] T-07 a plain event has no axe violations", async () => {
    const { container } = await renderDetail(AFTERNOON_WALK_KEY);

    expect(await axe(container)).toHaveNoViolations();
  });
});
