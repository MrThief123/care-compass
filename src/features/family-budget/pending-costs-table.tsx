import { formatDollars } from "@/features/family-home/home-format";
import { cn } from "@/lib/utils";
import type { BudgetBucketSummary, FundEntry } from "@/types/domain";

import { pendingCosts } from "./budget-edit";
import { bucketName } from "./budget-export";
import { formatFundDate } from "./budget-format";
import { DetailsButton, ENTRY_ROW, openFromRow, type OpenEntryDetails } from "./entry-row";

export interface PendingCostsTableProps {
  /** Labels the table; the Pending costs card's heading. */
  headingId: string;
  /** History's rows; only those still pending are listed. */
  history: FundEntry[];
  buckets: BudgetBucketSummary[];
  onOpen: OpenEntryDetails;
}

/**
 * Wide (`@xl`): DATE, BUCKET, DESCRIPTION and AMOUNT side by side, the text
 * columns sharing the rest. Narrow: the description, then the bucket, then the
 * date and the amount on one line. Same approach as History (FD-03, FD-10).
 */
const ROW_GRID = cn(
  "grid items-center gap-x-4 text-body-default text-text-primary",
  "grid-cols-[minmax(0,1fr)_auto] [grid-template-areas:'desc_desc'_'bucket_bucket'_'date_amount']",
  "@xl:grid-cols-[7.5rem_minmax(0,2fr)_minmax(0,3fr)_clamp(9rem,18%,12rem)]",
  "@xl:[grid-template-areas:'date_bucket_desc_amount']",
);

const HEAD_CELL = "min-w-0 text-left text-label-caps text-text-secondary";

/**
 * The costs still waiting for funds (CHG-022, PD-060, FD-13), oldest first, the
 * order they are paid in. The amount is shown as a positive cost ('$310') and
 * the bucket by its name now. Each row opens the entry's details, as in History.
 */
export function PendingCostsTable({ headingId, history, buckets, onOpen }: PendingCostsTableProps) {
  const costs = pendingCosts(history);

  return (
    <div className="@container mt-4">
      <table role="table" aria-labelledby={headingId} className="block w-full text-left">
        <thead role="rowgroup" className="sr-only @xl:not-sr-only @xl:block">
          <tr role="row" className={cn(ROW_GRID, "border-b border-border-subtle pb-2")}>
            <th role="columnheader" scope="col" className={cn(HEAD_CELL, "[grid-area:date]")}>
              Date
            </th>
            <th role="columnheader" scope="col" className={cn(HEAD_CELL, "[grid-area:bucket]")}>
              Bucket
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
          {costs.map((entry) => {
            const bucket = bucketName(entry, buckets);
            return (
              <tr
                key={entry.id}
                role="row"
                onClick={openFromRow(entry, onOpen)}
                className={cn(ROW_GRID, ENTRY_ROW)}
              >
                <td
                  role="cell"
                  className="min-w-0 [grid-area:date] text-body-small whitespace-nowrap text-text-secondary @xl:text-body-default @xl:text-text-primary"
                >
                  {formatFundDate(entry.date)}
                </td>
                <td
                  role="cell"
                  title={bucket}
                  className="line-clamp-2 min-w-0 [grid-area:bucket] text-body-small text-text-secondary [overflow-wrap:anywhere] @xl:text-body-default @xl:text-text-primary"
                >
                  {bucket}
                </td>
                <td role="cell" className="min-w-0 [grid-area:desc]">
                  <DetailsButton description={entry.description?.trim()} />
                </td>
                <td
                  role="cell"
                  className="min-w-0 [grid-area:amount] text-right [overflow-wrap:anywhere]"
                >
                  {formatDollars(Math.abs(entry.amount))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
