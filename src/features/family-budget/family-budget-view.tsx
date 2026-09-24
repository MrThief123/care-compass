import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { BudgetBucketTile } from "@/features/family-home/budget-bucket-tile";

import { HistoryTable } from "./history-table";
import { UpdateFundsButton } from "./update-funds-button";

import type { FamilyBudgetData } from "./budget-data";

/**
 * Family · Budget (design `family-06-budget`): 'Funds by source', a card per
 * funding bucket with an 'Update' button, and the fund History under it. The
 * two cards are independent, so either can be empty alone. Presentational:
 * everything it shows comes in as props. The client's name is not repeated
 * here; the shell header shows it (DECISIONS.md FD-08).
 *
 * The bucket cards are Home's `BudgetBucketTile` and flow into as many columns
 * as fit (three side by side at the design's width), so any number of buckets
 * wraps rather than scrolls sideways (FD-01).
 */
export function FamilyBudgetView({ data }: { data: FamilyBudgetData }) {
  const { buckets, history } = data;

  return (
    <div className="flex min-w-0 flex-col gap-[22px] px-6 py-5">
      <section aria-labelledby="family-budget-funds">
        <CardShell className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2 id="family-budget-funds" className="min-w-0 text-title-section text-text-primary">
              Funds by source
            </h2>
            <UpdateFundsButton />
          </div>
          {buckets.length === 0 ? (
            <EmptyState
              icon="dollar"
              title="No funding set up yet"
              body="Funding buckets will appear here once they are set up."
            />
          ) : (
            <ul className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
              {buckets.map((bucket, index) => (
                // A client can hold several buckets of one kind, so the kind alone is not a key.
                <li key={`${index}:${bucket.kind}:${bucket.label}`} className="min-w-0">
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
