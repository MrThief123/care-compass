import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import type { TaskLogParams } from "@/features/family-task-log/task-log-params";
import { getEventDocuments } from "@/server/documents/queries";
import { getOccurrence } from "@/server/events/queries";
import type { EventDocument, Occurrence } from "@/types/domain";

import { TaskDetailView } from "./task-detail-view";

const ID = "client-margaret";
const MORNING_MEDICATION_KEY = "event-margaret-morning-meds:2026-11-30T09:00:00+11:00";
const PLANNED_PHYSIO_KEY = "event-margaret-physio:2026-11-30T11:30:00+11:00";
const OVERDUE_WEIGH_IN_KEY = "event-margaret-weigh-in:2026-11-29T09:30:00+11:00";

/** A task and its documents, read through the real contract (mock data source). */
async function load(key: string) {
  const occurrence = (await getOccurrence(ID, key))!;
  const documents = await getEventDocuments(ID, occurrence.eventId);
  return { occurrence, documents };
}

async function renderDetail(
  key = MORNING_MEDICATION_KEY,
  extra: {
    occurrence?: Partial<Occurrence>;
    documents?: EventDocument[];
    backParams?: TaskLogParams;
  } = {},
) {
  const loaded = await load(key);
  return render(
    <TaskDetailView
      clientId={ID}
      occurrence={{ ...loaded.occurrence, ...extra.occurrence }}
      documents={extra.documents ?? loaded.documents}
      backParams={extra.backParams}
    />,
  );
}

describe("[FAM-UI-07] TaskDetailView", () => {
  it("[FAM-UI-07][AC-04] shows 'Done · Aisha Rahman' and 'Completed at 09:14' for the Morning medication", async () => {
    await renderDetail();

    const statusCard = screen.getByRole("region", { name: "Status" });
    expect(within(statusCard).getByText("Done · Aisha Rahman")).toBeInTheDocument();
    expect(within(statusCard).getByText("Completed at 09:14")).toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-04] shows the title and 'Monday 30 November 2026 · Assigned to Aisha Rahman'", async () => {
    await renderDetail();

    expect(
      screen.getByRole("heading", { level: 1, name: "Morning medication" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Monday 30 November 2026 · Assigned to Aisha Rahman"),
    ).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] links 'Back to Task log' to the plain Task log when opened without a view", async () => {
    await renderDetail();

    expect(screen.getByRole("link", { name: "Back to Task log" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks",
    );
  });

  it("[FAM-UI-07][AC-08] 'Back to Task log' returns to the same q, status and page", async () => {
    await renderDetail(MORNING_MEDICATION_KEY, {
      backParams: { q: "medication", status: "done", page: 3 },
    });

    expect(screen.getByRole("link", { name: "Back to Task log" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks?q=medication&status=done&page=3",
    );
  });

  it("[FAM-UI-07][PRD] shows the Description card with an Edit link to the event's edit route", async () => {
    await renderDetail();

    const card = screen.getByRole("region", { name: "Description" });
    expect(
      within(card).getByText(
        "Administer morning medication as per the current care plan. Confirm with Margaret before administering and record any side effects.",
      ),
    ).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/family/client-margaret/events/event-margaret-morning-meds/edit",
    );
  });

  it("[FAM-UI-07][PRD] shows the Documents card with a tile per document: name, type and size", async () => {
    await renderDetail();

    const card = screen.getByRole("region", { name: "Documents" });
    expect(within(card).getAllByRole("listitem")).toHaveLength(1);
    expect(within(card).getByText("Medication chart.pdf")).toBeInTheDocument();
    expect(within(card).getByText("PDF · 82.3 KB")).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows every document an event has, in the order the contract gives", async () => {
    await renderDetail(PLANNED_PHYSIO_KEY);

    const card = screen.getByRole("region", { name: "Documents" });
    expect(
      within(card)
        .getAllByRole("listitem")
        .map((item) => within(item).getByText(/\.pdf$/).textContent),
    ).toEqual(["Physio referral.pdf", "Exercise plan.pdf"]);
  });

  it("[FAM-UI-07][PRD] says so when the task has no documents", async () => {
    await renderDetail(MORNING_MEDICATION_KEY, { documents: [] });

    expect(screen.getByText("No documents attached.")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows only the Planned pill, and no completion time, for a planned task", async () => {
    await renderDetail(PLANNED_PHYSIO_KEY);

    expect(screen.getByText("Planned")).toBeInTheDocument();
    expect(screen.queryByText(/Completed at/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Monday 30 November 2026 · Assigned to Aisha Rahman"),
    ).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows the Overdue pill and 'Assigned to —' when no shift covers the task", async () => {
    await renderDetail(OVERDUE_WEIGH_IN_KEY);

    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.queryByText(/Completed at/)).not.toBeInTheDocument();
    expect(screen.getByText("Sunday 29 November 2026 · Assigned to —")).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows the actor, not the assignee, once someone else has completed the task", async () => {
    await renderDetail(MORNING_MEDICATION_KEY, { occurrence: { actor: "Sarah Nguyen" } });

    expect(screen.getByText("Done · Sarah Nguyen")).toBeInTheDocument();
    expect(
      screen.getByText("Monday 30 November 2026 · Assigned to Sarah Nguyen"),
    ).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] omits the completion time when a Done task has none recorded", async () => {
    await renderDetail(MORNING_MEDICATION_KEY, { occurrence: { completedAt: undefined } });

    expect(screen.getByText("Done · Aisha Rahman")).toBeInTheDocument();
    expect(screen.queryByText(/Completed at/)).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] renders a 120-character title, a long description and non-ASCII text in full", async () => {
    const longTitle = `Medication ${"administration and observation ".repeat(5)}`
      .trim()
      .slice(0, 120);
    const longDescription = "Confirm with the client before administering. ".repeat(20).trim();
    const nonAscii = "朝の投薬の確認 — Médicament du matin 🏃‍♀️";
    await renderDetail(MORNING_MEDICATION_KEY, {
      occurrence: { title: longTitle, description: `${longDescription}\n${nonAscii}` },
    });

    expect(longTitle).toHaveLength(120);
    expect(screen.getByRole("heading", { level: 1, name: longTitle })).toBeInTheDocument();
    expect(screen.getByText(longDescription, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(nonAscii, { exact: false })).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] has no axe violations for done, planned and overdue tasks, with and without documents", async () => {
    for (const key of [MORNING_MEDICATION_KEY, PLANNED_PHYSIO_KEY, OVERDUE_WEIGH_IN_KEY]) {
      const { container, unmount } = await renderDetail(key);
      expect(await axe(container)).toHaveNoViolations();
      unmount();
    }
  });
});
