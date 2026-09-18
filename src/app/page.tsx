"use client";

import { useState } from "react";

// UI
import { Button } from "../components/ui/button";
import { SegmentedControl } from "../components/ui/segmented-control";
import { Icon } from "../components/ui/icon";
import { Avatar } from "../components/ui/avatar";
import { CountBadge } from "../components/ui/count-badge";
import { ProgressBar } from "../components/ui/progress-bar";
import { Checkbox } from "../components/ui/checkbox";
import { CardShell } from "../components/ui/card-shell";

// Shared
import { RailNav } from "../components/shared/rail-nav";
import { StatusPill } from "../components/shared/status-pill";
import { DataTable } from "../components/shared/lists/data-table";
import { NotificationRow } from "../components/shared/lists/notification-row";
import { AlertListCard } from "../components/shared/lists/alert-list-card";
import { SelectableListRow } from "../components/shared/lists/selectable-list-row";
import { TaskChecklist } from "../components/shared/lists/task-checklist";
import { ActivityRow } from "../components/shared/lists/activity-row";
import { ScreenTitle } from "../components/shared/screen-title";
import { ClientInfoView } from "../components/shared/client-info-view";
import { PersonCard } from "../components/shared/cards/person-card";
import { BudgetBucketCard } from "../components/shared/cards/budget-bucket-card";
import { StatCard } from "../components/shared/cards/stat-card";
import { SearchField } from "../components/shared/search-field";
import { Rail } from "../components/shared/rail";
import { PageHeader } from "../components/shared/page-header";

function App() {
  // ------------------------------------------------------------
  // Example state
  // ------------------------------------------------------------

  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState(false);
  const [search, setSearch] = useState("");

  const [tasks, setTasks] = useState([
    {
      id: "1",
      label: "Review care plan",
      checked: true,
    },
    {
      id: "2",
      label: "Contact support coordinator",
      checked: false,
    },
    {
      id: "3",
      label: "Upload latest assessment",
      checked: false,
    },
  ]);

  const toggleTask = (id: string) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, checked: !task.checked }
          : task
      )
    );
  };

  return (
    <main
      style={{
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        gap: "48px",
      }}
    >
      {/* ========================================================
          HEADER
          ======================================================== */}

      <header>
        <h1>Component Showcase</h1>

        <p>
          Development page displaying the components from{" "}
          <code>src/components</code>.
        </p>
      </header>

      {/* ========================================================
          UI COMPONENTS
          ======================================================== */}

      <section>
        <h2>UI Components</h2>

        {/* Button */}
        <div>
          <h3>Button</h3>
          <Button />
        </div>

        {/* Segmented Control */}
        <div>
          <h3>Segmented Control</h3>
          <SegmentedControl />
        </div>

        {/* Icon */}
        <div>
          <h3>Icon</h3>
          <Icon name="home" />
        </div>

        {/* Avatar */}
        <div>
          <h3>Avatar</h3>
          <Avatar name="Sarah Johnson" />
        </div>

        {/* Count Badge */}
        <div>
          <h3>Count Badge</h3>
          <CountBadge count={7} />
        </div>

        {/* Progress Bar */}
        <div>
          <h3>Progress Bar</h3>
          <ProgressBar
            value={65}
            label="Care plan completion"
          />
        </div>

        {/* Checkbox */}
        <div>
          <h3>Checkbox</h3>

          <Checkbox
            label="Example checkbox"
            checked={checked}
            onChange={setChecked}
          />
        </div>

        {/* Card Shell */}
        <div>
          <h3>Card Shell</h3>
          <CardShell />
        </div>
      </section>

      {/* ========================================================
          NAVIGATION
          ======================================================== */}

      <section>
        <h2>Navigation</h2>

        {/* Rail */}
        <div>
          <h3>Rail</h3>

          <Rail
            role="family"
            basePath="/"
          />
        </div>

        {/* Rail Navigation */}
        <div>
          <h3>Rail Navigation</h3>

          <RailNav
            role="family"
            basePath="/"
          />
        </div>

        {/* Page Header */}
        <div>
          <h3>Page Header</h3>

          <PageHeader
            subject="Client Care Plan"
            date="18 September 2026"
            userFirstName="Sarah"
          />
        </div>

        {/* Screen Title */}
        <div>
          <h3>Screen Title</h3>

          <ScreenTitle
            role="carer"
            basePath="/"
          />
        </div>
      </section>

      {/* ========================================================
          SHARED COMPONENTS
          ======================================================== */}

      <section>
        <h2>Shared Components</h2>

        {/* Status Pill */}
        <div>
          <h3>Status Pill</h3>

          <StatusPill status="done" />
          <StatusPill status="planned" />
          <StatusPill status="overdue" />
        </div>

        {/* Notification Row */}
        <div>
          <h3>Notification Row</h3>

          <NotificationRow
            source="admin"
            message="A new document has been added to Sarah's care plan."
          />
        </div>

        {/* Selectable List Row */}
        <div>
          <h3>Selectable List Row</h3>

          <SelectableListRow
            name="Sarah Johnson"
            selected={selected}
            onClick={() => setSelected(!selected)}
          />
        </div>

        {/* Activity Row */}
        <div>
          <h3>Activity Row</h3>

          <ActivityRow
            title="Care plan updated"
            date="18 September 2026"
            status="done"
          />
        </div>

        {/* Search Field */}
        <div>
          <h3>Search Field</h3>

          <SearchField
            value={search}
            onChange={setSearch}
          />
        </div>
      </section>

      {/* ========================================================
          LIST COMPONENTS
          ======================================================== */}

      <section>
        <h2>List Components</h2>

        {/* Task Checklist */}
        <div>
          <h3>Task Checklist</h3>

          <TaskChecklist
            items={tasks}
            onToggle={toggleTask}
          />
        </div>

        {/* Data Table */}
        <div>
          <h3>Data Table</h3>

          <DataTable
            columns={[
              {
                key: "name",
                header: "Client",
                render: (row) => row.name,
              },
              {
                key: "status",
                header: "Status",
                render: (row) => row.status,
              },
              {
                key: "updated",
                header: "Last Updated",
                render: (row) => row.updated,
              },
            ]}
            rows={[
              {
                id: "1",
                name: "Sarah Johnson",
                status: "done",
                updated: "Today",
              },
              {
                id: "2",
                name: "James Wilson",
                status: "Review",
                updated: "Yesterday",
              },
              {
                id: "3",
                name: "Emily Brown",
                status: "Planned",
                updated: "12 Sep 2026",
              },
            ]}
            rowKey={(row) => row.id}
          />
        </div>

        {/* Alert List Card */}
        <div>
          <h3>Alert List Card</h3>

          <AlertListCard
            title="Outstanding Alerts"
            count={3}
            rows={[
              {
                key: "alert-1",
                title: "Medication review required",
                date: "Fri 18 Sep",
              },
              {
                key: "alert-2",
                title: "Care plan expires soon",
                date: "Sat 19 Sep",
              },
              {
                key: "alert-3",
                title: "Document missing",
                date: "Mon 21 Sep",
              },
            ]}
          />
        </div>
      </section>

      {/* ========================================================
          CARD COMPONENTS
          ======================================================== */}

      <section>
        <h2>Card Components</h2>

        {/* Person Card */}
        <div>
          <h3>Person Card</h3>

          <PersonCard
            name="Sarah Johnson"
            meta="NDIS Participant · Melbourne"
          />
        </div>

        {/* Budget Bucket Card */}
        <div>
          <h3>Budget Bucket Card</h3>

          <BudgetBucketCard
            summary={{
              kind: "ndis",
              label: "Core Supports",
              total: 10000,
              used: 5750,
              remaining: 4250,
              percentUsed: 57.5,
              state: "warning",
            }}
          />
        </div>

        {/* Stat Card */}
        <div>
          <h3>Stat Card</h3>

          <StatCard
            label="Planned Clients"
            value="24"
          />
        </div>
      </section>

      {/* ========================================================
          CLIENT INFORMATION
          ======================================================== */}

      <section>
        <h2>Client Information</h2>

        {/* Client Info View */}
        <div>
          <h3>Client Info View</h3>

          <ClientInfoView
            clientName="Sarah Johnson"
            clientMeta="NDIS Participant · Client ID 10482"
            sections={[
              {
                id: "section-1",
                clientId: "10482",
                kind: "description",
                title: "Personal Information",
                content:
                  "Sarah Johnson is an NDIS participant based in Melbourne, VIC. Her current care plan focuses on maintaining independence and community participation.",
                updatedAt: "18 September 2026",
              },
              {
                id: "section-2",
                clientId: "10482",
                kind: "habits",
                title: "Support Information",
                content:
                  "Sarah receives weekly community access support and assistance with planning appointments and daily activities.",
                updatedAt: "17 September 2026",
              },
              {
                id: "section-3",
                clientId: "10482",
                kind: "medicalHistory",
                title: "Medical History",
                content:
                  "Relevant medical information is recorded in the participant's current care documentation.",
                updatedAt: "15 September 2026",
              },
            ]}
            documents={[
              {
                id: "doc-1",
                clientId: "10482",
                name: "Care Plan.pdf",
                url: "/documents/care-plan.pdf",
                uploadedAt: "18 September 2026",
              },
              {
                id: "doc-2",
                clientId: "10482",
                name: "Support Assessment.pdf",
                url: "/documents/support-assessment.pdf",
                uploadedAt: "12 September 2026",
              },
            ]}
            canEdit={true}
          />
        </div>
      </section>
    </main>
  );
}

export default App;

