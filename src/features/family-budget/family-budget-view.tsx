"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { BudgetBucketTile } from "@/features/family-home/budget-bucket-tile";
import { cn } from "@/lib/utils";

import { useBudgetHolder, useHeldBudget } from "./budget-holder";
import { HistoryTable } from "./history-table";

import type { FamilyBudgetData } from "./budget-data";

/**
 * Family · Budget (design `family-06-budget`): 'Funds by source', a card per
 * funding bucket with an 'Edit' link to the Edit budget page, and the fund
 * History under it. The two cards are independent, so either can be empty
 * alone. The client's name is not repeated here; the shell header shows it
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

      <section aria-labelledby="family-budget-history">
        <CardShell className="p-5">
          <h2 id="family-budget-history" className="text-title-section text-text-primary">
            History
          </h2>
          {history.length === 0 ? (
            <EmptyState
              icon="dollar"
              title="No fund history yet"
              body="Top-ups and expenses will appear here once funds are added."
            />
          ) : (
            <HistoryTable headingId="family-budget-history" entries={history} />
          )}
        </CardShell>
      </section>
    </div>
  );
}
