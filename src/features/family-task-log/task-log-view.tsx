"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";

import { Field, type FieldOption } from "@/components/shared/forms/field";
import { DataTable, type DataTableColumn } from "@/components/shared/lists/data-table";
import { SearchField } from "@/components/shared/search-field";
import { EmptyState } from "@/components/shared/states";
import { StatusPill } from "@/components/shared/status-pill";
import { CardShell } from "@/components/ui/card-shell";
import { formatShortDate } from "@/lib/format/date";
import type { Occurrence, OccurrenceStatus } from "@/types/domain";

import { occurrenceNurse } from "./occurrence-display";
import { pageRange } from "./pagination";
import { TaskLogPager } from "./task-log-pager";
import { clampQueryLength, normaliseQuery, type TaskLogParams } from "./task-log-params";
import { taskDetailHref, taskLogHref } from "./task-routes";

/** How long typing must pause before the search is put in the URL. */
export const SEARCH_DEBOUNCE_MS = 400;

export interface TaskLogViewProps {
  clientId: string;
  /** This page's rows, in the order the contract returned them (newest first). Never re-sorted. */
  items: Occurrence[];
  /** Rows across all pages, after the search and Status. */
  total: number;
  pageSize: number;
  /** The validated URL state. */
  params: TaskLogParams;
}

type StatusChoice = "all" | OccurrenceStatus;

const STATUS_OPTIONS: (FieldOption & { value: StatusChoice })[] = [
  { value: "all", label: "All statuses" },
  { value: "planned", label: "Planned" },
  { value: "done", label: "Done" },
  { value: "overdue", label: "Overdue" },
];

function toStatusChoice(value: string): StatusChoice | undefined {
  return STATUS_OPTIONS.find((option) => option.value === value)?.value;
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
 * Family · Task log (FAM-UI-07): title, search, Status select, the
 * DATE · TASK · NURSE · STATUS table and a pager. The page shows one page of
 * the whole history: search, Status and page are the URL's `?q=&status=&page=`
 * and the server answers them (CHG-005), so this component only shows what it
 * is given and moves the URL.
 */
export function TaskLogView({ clientId, items, total, pageSize, params }: TaskLogViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setOptimisticStatus] = useOptimistic<StatusChoice>(params.status ?? "all");

  // What is in the box (it runs ahead of the URL while someone types), the URL's search as of the
  // last render, and the last search this component sent to the URL.
  const [draft, setDraft] = useState(params.q);
  const [seenQ, setSeenQ] = useState(params.q);
  const [sentQ, setSentQ] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef(params);

  useEffect(() => {
    latest.current = params;
  });

  // The URL moved. Follow it (Back, Forward, a shared link, a link from Home), except when it is
  // only our own search arriving, which must not overwrite words typed since.
  if (params.q !== seenQ) {
    setSeenQ(params.q);
    if (params.q !== sentQ) setDraft(params.q);
  }

  // A search that was still waiting when the URL moved somewhere else is stale: drop it.
  useEffect(() => {
    if (params.q !== sentQ) clearTimeout(timer.current);
  }, [params.q, sentQ]);

  useEffect(() => () => clearTimeout(timer.current), []);

  /** Puts a search and Status in the URL on page 1 (changing either resets the page). */
  function go(next: { q: string; status?: OccurrenceStatus }) {
    clearTimeout(timer.current);
    const current = latest.current;
    if (next.q === current.q && next.status === current.status) return;
    setSentQ(next.q);
    startTransition(() => {
      setOptimisticStatus(next.status ?? "all");
      router.replace(taskLogHref(clientId, { ...next, page: 1 }), { scroll: false });
    });
  }

  function handleType(value: string) {
    const next = clampQueryLength(value);
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => go({ q: normaliseQuery(next), status: latest.current.status }),
      SEARCH_DEBOUNCE_MS,
    );
  }

  const filtered = params.q !== "" || params.status !== undefined;
  const { from, to } = pageRange(params.page, pageSize, total);

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
          href={taskDetailHref(clientId, occurrence.key, params)}
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
        <form
          role="search"
          aria-label="Search tasks"
          className="min-w-0 flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            go({ q: normaliseQuery(draft), status: latest.current.status });
          }}
        >
          <SearchField
            value={draft}
            onChange={handleType}
            onClear={() => {
              setDraft("");
              go({ q: "", status: latest.current.status });
            }}
            loading={isPending}
            placeholder="Search tasks"
            noResultsFor={total === 0 && params.q ? params.q : undefined}
          />
        </form>
        <Field
          className="w-[220px] shrink-0"
          label="Status"
          type="select"
          value={status}
          onChange={(value) => {
            const choice = toStatusChoice(value);
            if (choice)
              go({ q: normaliseQuery(draft), status: choice === "all" ? undefined : choice });
          }}
          options={STATUS_OPTIONS}
        />
      </div>

      <CardShell className="px-2 py-3" aria-busy={isPending}>
        {items.length === 0 ? (
          filtered ? (
            <EmptyState
              icon="search"
              title="No tasks found"
              body="Try a different search or choose another status."
            />
          ) : (
            <EmptyState
              title="No tasks yet"
              body="Tasks will appear here once care events are scheduled."
            />
          )
        ) : (
          <DataTable
            className={TABLE_LAYOUT}
            columns={columns}
            rows={items}
            rowKey={(occurrence) => occurrence.key}
            onRowClick={(occurrence) =>
              router.push(taskDetailHref(clientId, occurrence.key, params))
            }
          />
        )}
      </CardShell>

      <TaskLogPager clientId={clientId} params={params} total={total} pageSize={pageSize} />

      {/* Announces what changed (WCAG 4.1.3); the visible message lives in the search field. */}
      <p role="status" className="sr-only">
        {items.length === 0 ? "No tasks to show" : `Showing ${from}-${to} of ${total} tasks`}
      </p>
    </div>
  );
}
