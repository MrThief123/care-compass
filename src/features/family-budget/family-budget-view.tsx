"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { BudgetBucketTile } from "@/features/family-home/budget-bucket-tile";
import { cn } from "@/lib/utils";
import type { FundEntry } from "@/types/domain";

import { budgetHistoryCsv, budgetHistoryFileName } from "./budget-export";
import { useBudgetHolder, useHeldBudget } from "./budget-holder";
import { EntryDetailsDialog } from "./entry-details-dialog";
import { HistoryTable } from "./history-table";
import { PendingCostsTable } from "./pending-costs-table";

import type { FamilyBudgetData } from "./budget-data";
import type { OpenEntryDetails } from "./entry-row";

/**
 * Family · Budget (design `family-06-budget`): 'Funds by source', a card per
 * funding bucket with an 'Edit' link to the Edit budget page, then 'Pending
 * costs' and the fund History with its 'Export' (CHG-022, FD-13). Each History
 * and pending row opens its entry's details. The cards are independent, so
 * any of them can be empty alone. The client's name is not repeated here; the shell header shows it
 * (DECISIONS.md FD-08).
 *
 * It shows the contract's figures, or what an Edit budget save left for this
 * client in the route's holder (CHG-021, FD-12; local state only, a reload
 * shows the fixtures again). After a save that changed something it says
 * "Budget updated." in its live region.
 *
 * The bucket cards are Home's `BudgetBucketTile` and flow into as many columns
 * as fit (three side by side at the design's width), so any number of buckets
 * wraps rather than scrolls sideways (FD-01).
 */
export function FamilyBudgetView({ clientId, data }: { clientId: string; data: FamilyBudgetData }) {
  const { buckets, history } = useHeldBudget(clientId, data);
  const { takeAnnouncement } = useBudgetHolder();
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<{ entry: FundEntry; trigger: HTMLElement | null }>();

  const openDetails: OpenEntryDetails = useCallback(
    (entry, trigger) => setDetails({ entry, trigger }),
    [],
  );
  const closeDetails = useCallback(() => setDetails(undefined), []);

  const exportHistory = () =>
    downloadCsv(budgetHistoryCsv(history, buckets), budgetHistoryFileName(data.today));

  // The live region is on screen first and the message goes in after, so it is announced.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a one-shot message handed over by the holder
    if (takeAnnouncement()) setMessage("Budget updated.");
  }, [takeAnnouncement]);

  return (
    <div className="flex min-w-0 flex-col gap-[22px] px-6 py-5">
      <section aria-labelledby="family-budget-funds">
        <CardShell className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2 id="family-budget-funds" className="min-w-0 text-title-section text-text-primary">
              Funds by source
            </h2>
            {/* It navigates, so it is a link styled as the kit's primary Button (as Home's 'Enter event'). */}
            <Link
              href={`/family/${clientId}/budget/edit`}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-control bg-primary px-5 text-body-emphasis text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Edit
            </Link>
            <p
              role="status"
              className={cn(
                "basis-full text-body-small text-text-secondary",
                !message && "sr-only",
              )}
            >
              {message}
            </p>
          </div>
          {buckets.length === 0 ? (
            <EmptyState
              icon="dollar"
              title="No funding set up yet"
              body="Choose ‘Edit’ to add a bucket."
            />
          ) : (
            <ul className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
              {buckets.map((bucket) => (
                // Keyed by the bucket's id (CHG-021): names and kinds can repeat.
                <li key={bucket.id} className="min-w-0">
                  <BudgetBucketTile summary={bucket} />
                </li>
              ))}
            </ul>
          )}
        </CardShell>
      </section>

      <section aria-labelledby="family-budget-pending">
        <CardShell className="p-5">
          <h2 id="family-budget-pending" className="text-title-section text-text-primary">
            Pending costs
          </h2>
          {history.some((entry) => entry.pending) ? (
            <PendingCostsTable
              headingId="family-budget-pending"
              history={history}
              buckets={buckets}
              onOpen={openDetails}
            />
          ) : (
            <p className="mt-2 text-body-default text-text-secondary">No pending costs.</p>
          )}
        </CardShell>
      </section>

      <section aria-labelledby="family-budget-history">
        <CardShell className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2 id="family-budget-history" className="min-w-0 text-title-section text-text-primary">
              History
            </h2>
            {history.length > 0 && (
              <Button type="button" variant="secondary" onClick={exportHistory}>
                Export
              </Button>
            )}
          </div>
          {history.length === 0 ? (
            <EmptyState
              icon="dollar"
              title="No fund history yet"
              body="Top-ups and expenses will appear here once funds are added."
            />
          ) : (
            <HistoryTable
              headingId="family-budget-history"
              entries={history}
              onOpen={openDetails}
            />
          )}
        </CardShell>
      </section>

      {details && (
        <EntryDetailsDialog
          entry={details.entry}
          buckets={buckets}
          returnFocusTo={details.trigger}
          onClose={closeDetails}
        />
      )}
    </div>
  );
}

/**
 * Downloads `csv` as `fileName` through a temporary link (FD-13). The file
 * starts with a UTF-8 byte-order mark so a spreadsheet reads names such as
 * "Zoë" correctly. The link never joins the page, and the object URL is let
 * go once the download has started.
 */
function downloadCsv(csv: string, fileName: string) {
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
