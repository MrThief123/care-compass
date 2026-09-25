"use client";

import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";

import { Field, type FieldOption } from "@/components/shared/forms/field";
import { SearchField } from "@/components/shared/search-field";
import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import type { Occurrence, OccurrenceStatus } from "@/types/domain";

import { pageRange } from "./pagination";
import { TaskLogPager } from "./task-log-pager";
import { clampQueryLength, normaliseQuery, type TaskLogParams } from "./task-log-params";
import { TaskLogTable } from "./task-log-table";
import { taskDetailHref, taskLogHref } from "./task-routes";

/** How long typing must pause before the search is put in the URL. */
export const SEARCH_DEBOUNCE_MS = 400;

/**
 * Local overrides for the kit `SearchField`, reached through its root `className` because the kit
 * is not lane F's to edit (DECISIONS.md FD-23): the design's brand-teal border (the Status select
 * has it, the kit search box has a light one), and a 44px by 44px Clear search target. The kit
 * draws that button 24px; its `::after` grows the hit area by 10px on every side while the circle
 * stays as designed.
 */
const SEARCH_FIELD_TONE = [
  "[&>div:first-child]:border-border-brand",
  "[&_button]:relative",
  "[&_button]:after:absolute",
  "[&_button]:after:-inset-2.5",
  "[&_button]:after:content-['']",
].join(" ");

/**
 * The search form. The Status `Field` draws its label above its select, so side by side the select
 * sits one label lower than the search box (DECISIONS.md FD-25). From the row width where the two
 * share a line (16rem search + 12px gap + 220px select = 30.5rem) the form is pushed down by the
 * label's line height plus the field's `gap-2`, which puts both boxes on the same top and bottom
 * edges. Pushing the box down, rather than bottom-aligning the row, keeps them level when the "No
 * matches" line lengthens the form below its box. `text-body-default` is the label's type token,
 * so `1lh` is the label's height. Stacked, in a narrower row, the search box has no offset.
 */
const FILTER_ROW_SEARCH =
  "min-w-0 flex-[1_1_16rem] text-body-default @min-[30.5rem]:mt-[calc(1lh+0.5rem)]";

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

  return (
    <div className="flex flex-col gap-5 px-6 pb-6 pt-5">
      <h1 className="text-title-page text-text-primary">Task log</h1>

      <div className="@container flex flex-wrap items-start gap-3">
        <form
          role="search"
          aria-label="Search tasks"
          className={FILTER_ROW_SEARCH}
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
            className={SEARCH_FIELD_TONE}
          />
        </form>
        <Field
          className="w-[220px] max-w-full shrink-0 gap-2"
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
          <TaskLogTable
            clientId={clientId}
            items={items}
            params={params}
            onOpen={(occurrence) => router.push(taskDetailHref(clientId, occurrence.key, params))}
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
