import { cn } from "@/lib/utils";
import type { FundEntry } from "@/types/domain";

import { formatFundDate, formatSignedDollars } from "./budget-format";

export interface HistoryTableProps {
  /** Labels the table; the History card's heading. */
  headingId: string;
  /** In the order given (the contract's: newest first). */
  entries: FundEntry[];
}

/**
 * Table layout from the breakpoint (`@xl`, a card 36rem wide), a two-line row
 * below it. Container queries, so it follows the width of the card and not of
 * the window. Wide: DATE and AMOUNT are tracks that do not depend on their
 * content and DESCRIPTION takes the rest (`minmax(0,1fr)`). Narrow: the
 * description on the first line, the date and the amount under it.
 */
const ROW_GRID = cn(
  "grid items-center gap-x-4 text-body-default text-text-primary",
  "grid-cols-[minmax(0,1fr)_auto] [grid-template-areas:'desc_desc'_'date_amount']",
  "@xl:grid-cols-[7.5rem_minmax(0,1fr)_clamp(9rem,18%,12rem)]",
  "@xl:[grid-template-areas:'date_desc_amount']",
);

const HEAD_CELL = "min-w-0 text-left text-label-caps text-text-secondary";

/**
 * The fund History: DATE, DESCRIPTION and AMOUNT, the description cell also
 * naming who recorded the entry (DECISIONS.md FD-05).
 *
 * Why this is not the shared `DataTable`: that is an auto-layout `<table>`, so
 * a long description would squeeze DATE and AMOUNT or push the amount past the
 * card's edge, and `src/components/shared` is not lane F's to edit (FD-03).
 * Same approach as the Task log's table: changing a table's `display` makes
 * some browsers drop its semantics, so the roles are stated explicitly, and
 * long text is cut by CSS only, so the DOM and a screen reader keep the whole
 * value; the full text is also in `title` for hover.
 */
export function HistoryTable({ headingId, entries }: HistoryTableProps) {
  return (
    <div className="@container mt-4">
      <table role="table" aria-labelledby={headingId} className="block w-full text-left">
        {/* Below the breakpoint the headings are visually hidden but stay in the accessibility tree. */}
        <thead role="rowgroup" className="sr-only @xl:not-sr-only @xl:block">
          <tr role="row" className={cn(ROW_GRID, "border-b border-border-subtle pb-2")}>
            <th role="columnheader" scope="col" className={cn(HEAD_CELL, "[grid-area:date]")}>
              Date
            </th>
            <th role="columnheader" scope="col" className={cn(HEAD_CELL, "[grid-area:desc]")}>
              Description
            </th>
            <th
              role="columnheader"
              scope="col"
              className={cn(HEAD_CELL, "[grid-area:amount] @xl:text-right")}
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className="block">
          {entries.map((entry) => {
            const description = entry.description?.trim();
            const recordedBy = entry.recordedBy?.trim();

            return (
              <tr
                key={entry.id}
                role="row"
                className={cn(
                  ROW_GRID,
                  "min-h-11 gap-y-1 border-b border-border-subtle py-2 last:border-b-0",
                )}
              >
                <td
                  role="cell"
                  className="min-w-0 [grid-area:date] text-body-small whitespace-nowrap text-text-secondary @xl:text-body-default @xl:text-text-primary"
                >
                  {formatFundDate(entry.date)}
                </td>
                <td role="cell" className="min-w-0 [grid-area:desc]">
                  <p
                    title={description || undefined}
                    className={cn(
                      "line-clamp-2 [overflow-wrap:anywhere]",
                      !description && "text-text-secondary",
                    )}
                  >
                    {description || "No description"}
                  </p>
                  {recordedBy && (
                    <p
                      title={`Recorded by ${recordedBy}`}
                      className="line-clamp-2 text-body-small text-text-secondary [overflow-wrap:anywhere]"
                    >
                      {`Recorded by ${recordedBy}`}
                    </p>
                  )}
                </td>
                <td
                  role="cell"
                  className="min-w-0 [grid-area:amount] text-right [overflow-wrap:anywhere]"
                >
                  {formatSignedDollars(entry.amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
