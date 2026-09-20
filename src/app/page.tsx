"use client";

import { useState } from "react";

import { CalendarHeader } from "../components/shared/calendar/calendar-header";
import { CurrentTimeLine } from "../components/shared/calendar/current-time-line";
import { DatePickerGrid } from "../components/shared/calendar/date-picker-grid";
import { DayTimeline } from "../components/shared/calendar/day-timeline";
import { EventPopover } from "../components/shared/calendar/event-popover";
import { MonthGrid } from "../components/shared/calendar/month-grid";
import { TimeGridScroller } from "../components/shared/calendar/time-grid-scroller";
import { WeekGrid } from "../components/shared/calendar/week-grid";
import { BudgetBucketCard } from "../components/shared/cards/budget-bucket-card";
import { PersonCard } from "../components/shared/cards/person-card";
import { StatCard } from "../components/shared/cards/stat-card";
import { ClientInfoView } from "../components/shared/client-info-view";
import { DevPreviewNav } from "../components/shared/dev-preview-nav";

// ============================================================
// UI
// ============================================================

// ============================================================
// Shared - Existing
// ============================================================

import { ChipGroup } from "../components/shared/forms/chip-group";
import { ConfirmationModal } from "../components/shared/forms/confirmation-modal";
import { DetailsFormCard } from "../components/shared/forms/details-form-card";
import { EventForm } from "../components/shared/forms/event-form";
import { Field } from "../components/shared/forms/field";
import { InlineAlert } from "../components/shared/forms/inline-alert";
import { SettingsActionCard } from "../components/shared/forms/settings-action-card";
import { SidePanelForm } from "../components/shared/forms/side-panel-form";
import { TimeSlotChips } from "../components/shared/forms/time-slot-chips";
import { ActivityRow } from "../components/shared/lists/activity-row";
import { AlertListCard } from "../components/shared/lists/alert-list-card";
import { DataTable } from "../components/shared/lists/data-table";
import { NotificationRow } from "../components/shared/lists/notification-row";
import { SelectableListRow } from "../components/shared/lists/selectable-list-row";
import { TaskChecklist } from "../components/shared/lists/task-checklist";
import { PageHeader } from "../components/shared/page-header";
import { Rail } from "../components/shared/rail";
import { RailNav } from "../components/shared/rail-nav";
import { ScreenTitle } from "../components/shared/screen-title";
import { SearchField } from "../components/shared/search-field";

// ============================================================
// Shared - Forms
// ============================================================

import { StatusPill } from "../components/shared/status-pill";
import { Avatar } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { CardShell } from "../components/ui/card-shell";
import { Checkbox } from "../components/ui/checkbox";
import { CountBadge } from "../components/ui/count-badge";
import { Icon } from "../components/ui/icon";
import { ProgressBar } from "../components/ui/progress-bar";
import { SegmentedControl } from "../components/ui/segmented-control";

// ============================================================
// Shared - Calendar
// ============================================================

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
      current.map((task) => (task.id === id ? { ...task, checked: !task.checked } : task)),
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
      <DevPreviewNav />

      {/* ========================================================
          HEADER
          ======================================================== */}

      <header>
        <h1>Component Showcase</h1>

        <p>
          Development page displaying the components from <code>src/components</code>.
        </p>
      </header>

      {/* ========================================================
          UI COMPONENTS
          ======================================================== */}

      <section>
        <h2>UI Components</h2>

        <div>
          <h3>Button</h3>
          <Button />
        </div>

        <div>
          <h3>Segmented Control</h3>
          <SegmentedControl />
        </div>

        <div>
          <h3>Icon</h3>
          <Icon name="home" />
        </div>

        <div>
          <h3>Avatar</h3>
          <Avatar name="Sarah Johnson" />
        </div>

        <div>
          <h3>Count Badge</h3>
          <CountBadge count={7} />
        </div>

        <div>
          <h3>Progress Bar</h3>
          <ProgressBar value={65} label="Care plan completion" />
        </div>

        <div>
          <h3>Checkbox</h3>
          <Checkbox label="Example checkbox" checked={checked} onChange={setChecked} />
        </div>

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

        <div>
          <h3>Rail</h3>
          <Rail role="family" basePath="/" />
        </div>

        <div>
          <h3>Rail Navigation</h3>
          <RailNav role="family" basePath="/" />
        </div>

        <div>
          <h3>Page Header</h3>
          <PageHeader subject="Client Care Plan" date="18 September 2026" userFirstName="Sarah" />
        </div>

        <div>
          <h3>Screen Title</h3>
          <ScreenTitle role="carer" basePath="/" />
        </div>
      </section>

      {/* ========================================================
          SHARED COMPONENTS
          ======================================================== */}

      <section>
        <h2>Shared Components</h2>

        <div>
          <h3>Status Pill</h3>

          <StatusPill status="done" />
          <StatusPill status="planned" />
          <StatusPill status="overdue" />
        </div>

        <div>
          <h3>Notification Row</h3>

          <NotificationRow
            source="admin"
            message="A new document has been added to Sarah's care plan."
          />
        </div>

        <div>
          <h3>Selectable List Row</h3>

          <SelectableListRow
            name="Sarah Johnson"
            selected={selected}
            onClick={() => setSelected(!selected)}
          />
        </div>

        <div>
          <h3>Activity Row</h3>

          <ActivityRow title="Care plan updated" date="18 September 2026" status="done" />
        </div>

        <div>
          <h3>Search Field</h3>

          <SearchField value={search} onChange={setSearch} />
        </div>
      </section>

      {/* ========================================================
          LIST COMPONENTS
          ======================================================== */}

      <section>
        <h2>List Components</h2>

        <div>
          <h3>Task Checklist</h3>

          <TaskChecklist items={tasks} onToggle={toggleTask} />
        </div>

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

        <div>
          <h3>Person Card</h3>

          <PersonCard name="Sarah Johnson" meta="NDIS Participant · Melbourne" />
        </div>

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

        <div>
          <h3>Stat Card</h3>

          <StatCard label="Planned Clients" value="24" />
        </div>
      </section>

      {/* ========================================================
          CLIENT INFORMATION
          ======================================================== */}

      <section>
        <h2>Client Information</h2>

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
      {/* ========================================================
          FORM COMPONENTS
          ======================================================== */}

      <section>
        <h2>Form Components</h2>

        {/* Details Form Card */}
        <div>
          <h3>Details Form Card</h3>

          <DetailsFormCard title="Client Details">
            <p>Example form content</p>
          </DetailsFormCard>
        </div>

        {/* Inline Alert */}
        <div>
          <h3>Inline Alert</h3>

          <InlineAlert>Example inline alert message.</InlineAlert>
        </div>

        {/* Field */}
        <div>
          <h3>Field</h3>

          <Field label="Client Name" value="Sarah Johnson" onChange={() => {}} />
        </div>

        {/* Chip Group */}
        <div>
          <h3>Chip Group</h3>

          <ChipGroup
            legend="Support Type"
            options={[
              { label: "Personal Care", value: "personal-care" },
              { label: "Community Access", value: "community-access" },
              { label: "Transport", value: "transport" },
            ]}
            value="personal-care"
            onChange={() => {}}
          />
        </div>

        {/* Time Slot Chips */}
        <div>
          <h3>Time Slot Chips</h3>

          <TimeSlotChips value={{ slot: "07:00-11:00" }} onChange={() => {}} />
        </div>

        {/* Side Panel Form */}
        <div>
          <h3>Side Panel Form</h3>

          <SidePanelForm title="Edit Client" submitLabel="Save" onSubmit={() => {}}>
            <Field label="Client Name" value="Sarah Johnson" onChange={() => {}} />
          </SidePanelForm>
        </div>

        {/* Settings Action Card */}
        <div>
          <h3>Settings Action Card</h3>

          <SettingsActionCard
            title="Account Settings"
            description="Manage your account settings."
            actionLabel="Manage"
            onAction={() => {}}
          />
        </div>

        {/* Confirmation Modal */}
        <div>
          <h3>Confirmation Modal</h3>

          <ConfirmationModal
            open={false}
            title="Delete Client"
            body="Are you sure you want to delete this client?"
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={() => {}}
            onCancel={() => {}}
          />
        </div>

        {/* Event Form */}
        <div>
          <h3>Event Form</h3>

          <EventForm
            values={{
              date: "2026-09-18",
              recurrence: "none",
              status: "planned",
              description: "",
            }}
            onChange={() => {}}
            onSubmit={() => {}}
            onCancel={() => {}}
            month="2026-09-01"
          />
        </div>
      </section>

      {/* ========================================================
          CALENDAR COMPONENTS
          ======================================================== */}

      <section>
        <h2>Calendar Components</h2>

        {/* Calendar Header */}
        <div>
          <h3>Calendar Header</h3>

          <CalendarHeader
            range={{
              start: "2026-09-14",
              end: "2026-09-20",
            }}
          />
        </div>

        {/* Date Picker Grid */}
        <div>
          <h3>Date Picker Grid</h3>

          <DatePickerGrid month="2026-09-01" />
        </div>

        {/* Month Grid */}
        <div>
          <h3>Month Grid</h3>

          <MonthGrid month="2026-09-01" />
        </div>

        {/* Week Grid */}
        <div>
          <h3>Week Grid</h3>

          <WeekGrid weekStart="2026-09-14" occurrences={[]} />
        </div>

        {/* Day Timeline */}
        <div>
          <h3>Day Timeline</h3>

          <DayTimeline occurrences={[]} />
        </div>

        {/* Time Grid Scroller */}
        <div>
          <h3>Time Grid Scroller</h3>

          <TimeGridScroller>
            <div style={{ height: "600px" }}>Example calendar content</div>
          </TimeGridScroller>
        </div>

        {/* Current Time Line */}
        <div>
          <h3>Current Time Line</h3>

          <CurrentTimeLine />
        </div>

        {/* Event Popover */}
        <div>
          <h3>Event Popover</h3>

          <EventPopover
            occurrence={{
              key: "showcase-event",
              eventId: "showcase-event",
              clientId: "10482",
              title: "Client Support Meeting",
              start: "2026-09-18T09:00:00+10:00",
              durationMinutes: 60,
              status: "planned",
              actor: "Support Coordinator",
              assignee: "Sarah Johnson",
              description: "Example calendar event.",
            }}
            anchor={null}
            onClose={() => {}}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
