"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Field, type FieldOption } from "@/components/shared/forms/field";
import { DataTable, type DataTableColumn } from "@/components/shared/lists/data-table";
import { SearchField } from "@/components/shared/search-field";
import { EmptyState } from "@/components/shared/states";
import { StatusPill } from "@/components/shared/status-pill";
import { CardShell } from "@/components/ui/card-shell";
import { formatShortDate } from "@/lib/format/date";
import type { Occurrence } from "@/types/domain";

import { occurrenceNurse } from "./occurrence-display";
import { filterTaskLog, sortTaskLog, type StatusFilter } from "./task-log-query";
import { taskDetailHref } from "./task-routes";

export interface TaskLogViewProps {
  clientId: string;
  items: Occurrence[];
}

const STATUS_OPTIONS: (FieldOption & { value: StatusFilter })[] = [
  { value: "all", label: "All statuses" },
  { value: "planned", label: "Planned" },
  { value: "done", label: "Done" },
  { value: "overdue", label: "Overdue" },
];

function isStatusFilter(value: string): value is StatusFilter {
  return STATUS_OPTIONS.some((option) => option.value === value);
}

/**
 * Column widths come from the cell content, so the TASK column takes all the
 * leftover width (`w-full`) and may shrink and wrap (`max-w-0`), while DATE,
 * NURSE and STATUS hug their content, as in the design. `DataTable` has no
 * width API, so this targets its columns by position (DECISIONS.md FD-09).
 */
const TABLE_LAYOUT =
  "[&_th:nth-child(2)]:w-full [&_td:nth-child(2)]:w-full [&_td:nth-child(2)]:max-w-0";

/**
 * Family · Task log (FAM-UI-07): title, search, Status select and the
 * DATE · TASK · NURSE · STATUS table. Search and filter act on the rows
 * client-side and reset on reload (PRD Scope).
 */
export function TaskLogView({ clientId, items }: TaskLogViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const visible = filterTaskLog(sortTaskLog(items), { query, status });
  const searchTerm = query.trim();

  const columns: DataTableColumn<Occurrence>[] = [
    {
      key: "date",
      header: "Date",
      render: (occurrence) => (
        <span className="block w-28 text-text-secondary">{formatShortDate(occurrence.start)}</span>
      ),
    },
    {
      key: "task",
      header: "Task",
      render: (occurrence) => (
        // A real link gives keyboard and screen-reader users the row's action; the
        // row's own click handler serves the pointer. Stop the click here so it
        // does not navigate twice. `-my-2 min-h-11` gives a 44px target inside the 50px row;
        // `w-fit` keeps the link (and its focus ring) to the text, not the whole column.
        <Link
          href={taskDetailHref(clientId, occurrence.key)}
          onClick={(event) => event.stopPropagation()}
          className="-my-2 flex min-h-11 w-fit max-w-full items-center break-words hover:underline"
        >
          {occurrence.title}
        </Link>
      ),
    },
    {
      key: "nurse",
      header: "Nurse",
      render: (occurrence) => {
        // One line, so the wide TASK column cannot squeeze a name onto two lines and
        // grow the row past 50px; a very long name truncates, its full text on hover.
        const nurse = occurrenceNurse(occurrence);
        return (
          <span title={nurse} className="block max-w-48 truncate text-text-secondary">
            {nurse}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (occurrence) => (
        <StatusPill status={occurrence.status} actorName={occurrenceNurse(occurrence)} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5 px-6 pb-6 pt-5">
      <h1 className="text-title-page text-text-primary">Task log</h1>

      <div className="flex items-start gap-3">
        <SearchField
          className="min-w-0 flex-1"
          value={query}
          onChange={setQuery}
          onClear={() => setQuery("")}
          placeholder="Search tasks"
          noResultsFor={
            items.length > 0 && visible.length === 0 && searchTerm ? searchTerm : undefined
          }
        />
        <Field
          className="w-[220px] shrink-0"
          label="Status"
          type="select"
          value={status}
          onChange={(value) => {
            if (isStatusFilter(value)) setStatus(value);
          }}
          options={STATUS_OPTIONS}
        />
      </div>

      <CardShell className="px-2 py-3">
        {items.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            body="Tasks will appear here once care events are scheduled."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="search"
            title="No tasks found"
            body="Try a different search or choose another status."
          />
        ) : (
          <DataTable
            className={TABLE_LAYOUT}
            columns={columns}
            rows={visible}
            rowKey={(occurrence) => occurrence.key}
            onRowClick={(occurrence) => router.push(taskDetailHref(clientId, occurrence.key))}
          />
        )}
      </CardShell>

      {/* Announces filter results (WCAG 4.1.3); the visible message lives in the search field. */}
      <p role="status" className="sr-only">
        Showing {visible.length} of {items.length} tasks
      </p>
    </div>
  );
}
