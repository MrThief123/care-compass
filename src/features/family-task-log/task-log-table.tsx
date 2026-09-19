import Link from "next/link";

import { StatusPill } from "@/components/shared/status-pill";
import { Icon } from "@/components/ui/icon";
import { formatShortDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import type { Occurrence } from "@/types/domain";

import { occurrenceNurse } from "./occurrence-display";
import { statusPillClassName } from "./status-pill-class";
import { taskDetailHref } from "./task-routes";

import type { TaskLogParams } from "./task-log-params";

export interface TaskLogTableProps {
  clientId: string;
  /** This page's rows, in the order given. */
  items: Occurrence[];
  /** The validated Task log view; task links carry it so 'Back to Task log' returns to it. */
  params: TaskLogParams;
  /** Whole-row pointer navigation; the title link is the keyboard and screen-reader way in. */
  onOpen: (occurrence: Occurrence) => void;
}

/**
 * Card layout by default; the table layout from the breakpoint (`@3xl` = a log 48rem wide, which
 * is a window of about 920px with the 88px rail). Container queries, so it follows the width of
 * the log itself and not of the window.
 *
 * Wide: five tracks that do not depend on their content. DATE is fixed, NURSE and STATUS are
 * bounded shares, the chevron is fixed and TASK takes the rest (`minmax(0,1fr)`).
 * Narrow: three lines (title; date and nurse; status pill) and the chevron on the right.
 */
const ROW_GRID = cn(
  "grid items-center text-body-default text-text-primary",
  "grid-cols-[auto_minmax(0,1fr)_2.5rem]",
  "[grid-template-areas:'task_task_chev'_'date_nurse_chev'_'status_status_chev']",
  "@3xl:grid-cols-[7rem_minmax(0,1fr)_clamp(9rem,20%,14rem)_clamp(12rem,26%,20rem)_2.5rem]",
  "@3xl:[grid-template-areas:'date_task_nurse_status_chev']",
);

const CELL = "min-w-0 px-3";
const HEAD_CELL = cn(CELL, "text-left text-label-caps text-text-secondary");

/**
 * The Task log's table: DATE, TASK, NURSE, STATUS and a chevron.
 *
 * Why this is not the shared `DataTable`: that is an auto-layout `<table>`, so each column is as
 * wide as its widest cell. A 51-character carer name in a Done pill (about 430px) set the STATUS
 * column's minimum for every row, squeezed TASK until its text ran into NURSE, and at narrower
 * windows pushed pills past the card's edge. A table whose cells have no size limits cannot be
 * made safe from outside, and `src/components/shared` is not lane F's to edit (DECISIONS.md
 * FD-20), so this is a local table whose columns are fixed tracks (see `ROW_GRID`).
 *
 * One DOM serves both layouts: one link and one copy of each title, and nothing hidden with
 * `display:none` or doubled for assistive technology. Changing a table's `display` makes some
 * browsers drop its semantics, so the roles are stated explicitly. Long text is cut by CSS only
 * (`line-clamp`, `truncate`), so the DOM, and a screen reader, keep the whole value; the full
 * text is also in `title` for hover.
 */
export function TaskLogTable({ clientId, items, params, onOpen }: TaskLogTableProps) {
  return (
    <div className="@container">
      <table role="table" className="block w-full text-left">
        {/* Below the breakpoint the headings are visually hidden but stay in the accessibility tree. */}
        <thead role="rowgroup" className="sr-only @3xl:not-sr-only @3xl:block">
          <tr role="row" className={cn(ROW_GRID, "@3xl:py-2")}>
            <th role="columnheader" scope="col" className={cn(HEAD_CELL, "[grid-area:date]")}>
              Date
            </th>
            <th role="columnheader" scope="col" className={cn(HEAD_CELL, "[grid-area:task]")}>
              Task
            </th>
            <th role="columnheader" scope="col" className={cn(HEAD_CELL, "[grid-area:nurse]")}>
              Nurse
            </th>
            <th role="columnheader" scope="col" className={cn(HEAD_CELL, "[grid-area:status]")}>
              Status
            </th>
            <th
              role="columnheader"
              scope="col"
              aria-hidden
              className={cn(HEAD_CELL, "[grid-area:chev]")}
            />
          </tr>
        </thead>

        <tbody role="rowgroup" className="block">
          {items.map((occurrence) => {
            const nurse = occurrenceNurse(occurrence);
            // Only a Done pill carries a name that can be cut; its whole text is on hover.
            const pillText = occurrence.status === "done" ? `Done · ${nurse}` : undefined;

            return (
              <tr
                key={occurrence.key}
                role="row"
                onClick={() => onOpen(occurrence)}
                className={cn(
                  ROW_GRID,
                  "cursor-pointer border-b border-border-subtle py-1 hover:bg-bg-inset",
                  "@3xl:min-h-[50px] @3xl:py-0",
                )}
              >
                <td
                  role="cell"
                  className={cn(
                    CELL,
                    "[grid-area:date] whitespace-nowrap pr-0 text-text-secondary @3xl:pr-3",
                  )}
                >
                  {formatShortDate(occurrence.start)}
                </td>

                <td role="cell" className={cn(CELL, "[grid-area:task]")}>
                  {/* A real link gives keyboard and screen-reader users the row's action; the row's
                      own click handler serves the pointer, so the link stops the click here. `w-fit`
                      keeps the link (and its focus ring) to the text, `min-h-11` is the 44px target. */}
                  <Link
                    href={taskDetailHref(clientId, occurrence.key, params)}
                    title={occurrence.title}
                    onClick={(event) => event.stopPropagation()}
                    className="flex min-h-11 w-fit max-w-full items-center hover:underline"
                  >
                    <span className="line-clamp-2 min-w-0 [overflow-wrap:anywhere]">
                      {occurrence.title}
                    </span>
                  </Link>
                </td>

                {/* Beside the date on the card layout, so a middle dot separates them (its
                    alternative text is empty, so it is not announced); no dot in the table. */}
                <td
                  role="cell"
                  className={cn(
                    CELL,
                    "[grid-area:nurse] flex items-center pl-0 text-text-secondary",
                    "before:mx-1.5 before:content-['·'_/_''] @3xl:pl-3 @3xl:before:content-none",
                  )}
                >
                  <span title={nurse} className="min-w-0 truncate">
                    {nurse}
                  </span>
                </td>

                <td role="cell" className={cn(CELL, "[grid-area:status]")}>
                  {/* The pill may shrink below its text; its label then ends in an ellipsis. The
                      whole text stays in the DOM, so assistive technology reads all of it. */}
                  <span title={pillText} className="flex min-w-0 max-w-full">
                    <StatusPill
                      status={occurrence.status}
                      actorName={nurse}
                      className={statusPillClassName(occurrence.status)}
                    />
                  </span>
                </td>

                <td role="cell" className={cn(CELL, "[grid-area:chev]")}>
                  <Icon
                    name="chevron-right"
                    size={16}
                    className="text-text-secondary"
                    aria-hidden
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
