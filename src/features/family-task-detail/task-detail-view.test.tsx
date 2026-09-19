import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { DESIGN_CLIENT_ID, DESIGN_TASK_LOG } from "@/features/family-task-log/design-fixtures";
import type { Occurrence } from "@/types/domain";

import { TaskDetailView } from "./task-detail-view";

const MORNING_MEDICATION = DESIGN_TASK_LOG[0]!;
const PLANNED_PHYSIO = DESIGN_TASK_LOG[1]!;
const OVERDUE_WEIGH_IN = DESIGN_TASK_LOG[4]!;

const MEDICATION_CHART = { id: "doc-medication-chart", name: "Medication chart.pdf" };

function renderDetail(
  occurrence: Occurrence = MORNING_MEDICATION,
  documents: { id: string; name: string }[] = [MEDICATION_CHART],
) {
  return render(
    <TaskDetailView clientId={DESIGN_CLIENT_ID} occurrence={occurrence} documents={documents} />,
  );
}

describe("[FAM-UI-07] TaskDetailView", () => {
  it("[FAM-UI-07][AC-04] shows 'Done · Aisha Rahman' and 'Completed at 09:14' for the Morning medication", () => {
    renderDetail();

    const statusCard = screen.getByRole("region", { name: "Status" });
    expect(within(statusCard).getByText("Done · Aisha Rahman")).toBeInTheDocument();
    expect(within(statusCard).getByText("Completed at 09:14")).toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-04] shows the title and 'Monday 30 November 2026 · Assigned to Aisha Rahman'", () => {
    renderDetail();

    expect(
      screen.getByRole("heading", { level: 1, name: "Morning medication" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Monday 30 November 2026 · Assigned to Aisha Rahman"),
    ).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] links 'Back to Task log' to the Task log route", () => {
    renderDetail();

    expect(screen.getByRole("link", { name: "Back to Task log" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks",
    );
  });

  it("[FAM-UI-07][PRD] shows the Description card with an Edit link to the event's edit route", () => {
    renderDetail();

    const card = screen.getByRole("region", { name: "Description" });
    expect(
      within(card).getByText(
        "Administer morning medication as per the current care plan. Confirm with Margaret before administering and record any side effects.",
      ),
    ).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/family/client-margaret/events/event-morning-medication/edit",
    );
  });

  it("[FAM-UI-07][PRD] shows the Documents card with a tile per document", () => {
    renderDetail();

    const card = screen.getByRole("region", { name: "Documents" });
    expect(within(card).getByText("Medication chart.pdf")).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] says so when the task has no documents", () => {
    renderDetail(MORNING_MEDICATION, []);

    expect(screen.getByText("No documents attached.")).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows only the Planned pill, and no completion time, for a planned task", () => {
    renderDetail(PLANNED_PHYSIO);

    expect(screen.getByText("Planned")).toBeInTheDocument();
    expect(screen.queryByText(/Completed at/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Monday 30 November 2026 · Assigned to Aisha Rahman"),
    ).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows the Overdue pill and 'Assigned to —' when no shift covers the task", () => {
    renderDetail(OVERDUE_WEIGH_IN);

    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.queryByText(/Completed at/)).not.toBeInTheDocument();
    expect(screen.getByText("Sunday 29 November 2026 · Assigned to —")).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows the actor, not the assignee, once someone else has completed the task", () => {
    renderDetail({ ...MORNING_MEDICATION, actor: "Sarah Nguyen" });

    expect(screen.getByText("Done · Sarah Nguyen")).toBeInTheDocument();
    expect(
      screen.getByText("Monday 30 November 2026 · Assigned to Sarah Nguyen"),
    ).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] omits the completion time when a Done task has none recorded", () => {
    renderDetail({ ...MORNING_MEDICATION, completedAt: undefined });

    expect(screen.getByText("Done · Aisha Rahman")).toBeInTheDocument();
    expect(screen.queryByText(/Completed at/)).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] renders a very long title, description and file name in full", () => {
    const longTitle = `Medication ${"administration and observation ".repeat(8).trim()}`;
    const longDescription = "Confirm with the client before administering. ".repeat(20).trim();
    const longFile = `${"very-long-document-name-".repeat(6)}.pdf`;
    renderDetail({ ...MORNING_MEDICATION, title: longTitle, description: longDescription }, [
      { id: "doc-long", name: longFile },
    ]);

    expect(screen.getByRole("heading", { level: 1, name: longTitle })).toBeInTheDocument();
    expect(screen.getByText(longDescription)).toBeInTheDocument();
    expect(screen.getByText(longFile)).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] has no axe violations for done, planned and overdue tasks", async () => {
    for (const occurrence of [MORNING_MEDICATION, PLANNED_PHYSIO, OVERDUE_WEIGH_IN]) {
      const { container, unmount } = renderDetail(occurrence);
      expect(await axe(container)).toHaveNoViolations();
      unmount();
    }
  });
});
