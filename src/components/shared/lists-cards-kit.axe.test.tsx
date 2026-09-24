import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { BudgetBucketCard } from "./cards/budget-bucket-card";
import { PersonCard } from "./cards/person-card";
import { StatCard } from "./cards/stat-card";
import { ClientInfoView } from "./client-info-view";
import { ActivityRow } from "./lists/activity-row";
import { AlertListCard } from "./lists/alert-list-card";
import { DataTable } from "./lists/data-table";
import { NotificationRow } from "./lists/notification-row";
import { SelectableListRow } from "./lists/selectable-list-row";
import { TaskChecklist } from "./lists/task-checklist";

describe("[UI-03][AC-06] lists/cards kit accessibility", () => {
  it("DataTable has no axe violations", async () => {
    const { container } = render(
      <DataTable
        columns={[{ key: "name", header: "Name", render: (row: { name: string }) => row.name }]}
        rows={[{ name: "Aisha Rahman" }]}
        rowKey={(row) => row.name}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ActivityRow has no axe violations", async () => {
    const { container } = render(
      <ActivityRow
        title="Morning medication"
        date="Sat 28 Nov"
        status="done"
        actorName="Aisha Rahman"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("AlertListCard has no axe violations", async () => {
    const { container } = render(
      <AlertListCard
        title="Overdue"
        count={1}
        rows={[{ key: "1", title: "Wound dressing check", date: "Fri 27 Nov" }]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("SelectableListRow has no axe violations", async () => {
    const { container } = render(
      <div role="listbox" aria-label="Staff">
        <SelectableListRow name="Aisha Rahman" selected onClick={() => {}} />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("PersonCard has no axe violations", async () => {
    const { container } = render(<PersonCard name="Margaret Doyle" meta="75 years · Ringwood" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("NotificationRow has no axe violations", async () => {
    const { container } = render(<NotificationRow source="family" message="New document added." />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("StatCard has no axe violations", async () => {
    const { container } = render(<StatCard label="Total clients" value="7" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("BudgetBucketCard has no axe violations", async () => {
    const { container } = render(
      <BudgetBucketCard
        summary={{
          kind: "government",
          label: "Government",
          total: 3000,
          used: 2760,
          remaining: 240,
          percentUsed: 92,
          state: "alert",
        }}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("TaskChecklist has no axe violations", async () => {
    const { container } = render(
      <TaskChecklist
        items={[{ id: "1", label: "Morning medication", checked: true }]}
        onToggle={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ClientInfoView has no axe violations", async () => {
    const { container } = render(
      <ClientInfoView
        clientName="Margaret"
        clientMeta="75 years · Ringwood"
        sections={[
          {
            id: "section-description",
            clientId: "client-margaret",
            kind: "description",
            title: "Description",
            content: "Enjoys gardening.",
            updatedAt: "2026-10-01T10:00:00+11:00",
          },
        ]}
        documents={[]}
        canEdit
        onEditSection={() => {}}
        onAddFile={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("[UI-05][AC-12] lists kit accessibility with plain events", () => {
  it("[UI-05][AC-12] ActivityRow for a plain event has no axe violations", async () => {
    const { container } = render(
      <ActivityRow title="Garden walk" date="Thu 26 Nov" kind="event" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[UI-05][AC-12] a clickable list of tasks and plain events has no axe violations", async () => {
    const { container } = render(
      <ul aria-label="Care log">
        <li>
          <ActivityRow
            title="Morning medication"
            date="Sat 28 Nov"
            status="done"
            actorName="Aisha Rahman"
            onClick={() => {}}
          />
        </li>
        <li>
          <ActivityRow title="Garden walk" date="Thu 26 Nov" kind="event" onClick={() => {}} />
        </li>
        <li>
          <ActivityRow
            title="Wound dressing check"
            date="Fri 27 Nov"
            status="overdue"
            onClick={() => {}}
          />
        </li>
      </ul>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
