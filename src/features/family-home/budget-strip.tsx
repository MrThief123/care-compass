import Link from "next/link";

import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import type { BudgetBucketSummary } from "@/types/domain";

import { BudgetBucketTile } from "./budget-bucket-tile";
import { summariseBudget, type BudgetTotals } from "./home-data";
import { formatDollars } from "./home-format";
import { homeRoutes } from "./home-routes";

export interface BudgetStripProps {
  clientId: string;
  buckets: BudgetBucketSummary[];
}

/** The aggregate line: "$17,870 remaining of $32,000 · 44% used", or the overspend when there is one. */
function aggregateLine({ remaining, total, percentUsed }: BudgetTotals): string {
  const amount =
    remaining < 0
      ? `${formatDollars(-remaining)} over budget`
      : `${formatDollars(remaining)} remaining`;
  return `${amount} of ${formatDollars(total)} · ${percentUsed}% used`;
}

/**
 * Budget strip: one aggregate line over the client's funding buckets, then a
 * card per bucket, however many there are. The cards flow into as many columns
 * as fit (three side by side at the design's width), so eight buckets make
 * three rows, not a page that scrolls sideways.
 */
export function BudgetStrip({ clientId, buckets }: BudgetStripProps) {
  const totals = summariseBudget(buckets);

  return (
    <section aria-labelledby="family-home-budget">
      <CardShell className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <h2 id="family-home-budget" className="text-title-section text-text-primary">
              Budget
            </h2>
            {buckets.length > 0 && (
              <p className="text-body-small break-words text-text-secondary">
                {aggregateLine(totals)}
              </p>
            )}
          </div>
          <Link
            href={homeRoutes.budget(clientId)}
            className="inline-flex min-h-11 shrink-0 items-center px-5 text-body-emphasis text-text-brand hover:underline"
          >
            View breakdown
          </Link>
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
  );
}
