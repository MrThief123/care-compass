import { CardShell } from "@/components/ui/card-shell";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import type { BudgetBucketState, BudgetBucketSummary } from "@/types/domain";

import { formatDollars } from "./home-format";

export interface BudgetBucketTileProps {
  summary: BudgetBucketSummary;
}

/** The status the icon stands for, as a word for screen readers; a healthy bucket has none. */
const STATUS_WORD: Record<BudgetBucketState, string | null> = {
  ok: null,
  warning: "Budget warning",
  alert: "Budget alert",
  exhausted: "Budget exhausted",
};

/**
 * One funding bucket: remaining, total and percent used, in the kit
 * `BudgetBucketCard`'s design (UI-03; PD-032 thresholds), made safe for real
 * data. Local because the kit card rounds cents away, upper-cases the name,
 * lets a long name or amount widen its cell, says nothing to a screen reader
 * about a warning, and shows an overspend as a bare minus sign (DECISIONS.md
 * FD-17).
 *
 * The name wraps to two lines and then ends in an ellipsis, with the whole name
 * on hover; an amount that is too wide for its card wraps rather than losing
 * digits. The progress bar is capped at 100%, so an overspend is also written
 * out as "over budget".
 */
export function BudgetBucketTile({ summary }: BudgetBucketTileProps) {
  const { label, total, remaining, state } = summary;
  const percentUsed = Number.isFinite(summary.percentUsed) ? summary.percentUsed : 0;
  const isAlertGround = state === "alert" || state === "exhausted";
  const statusWord = STATUS_WORD[state];

  return (
    <CardShell
      tone={isAlertGround ? "alert" : "neutral"}
      className="flex h-full min-w-0 flex-col gap-1"
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p
          title={label}
          className="line-clamp-2 min-w-0 text-label-caps break-words text-text-secondary normal-case"
        >
          {label}
        </p>
        {statusWord && (
          <>
            <Icon
              name="alert-triangle"
              size={14}
              className={cn(
                "mt-px shrink-0",
                isAlertGround ? "text-text-alert-strong" : "text-text-alert",
              )}
              aria-hidden
            />
            <span className="sr-only">{statusWord}</span>
          </>
        )}
      </div>
      <p
        className={cn(
          "text-metric-large [overflow-wrap:anywhere]",
          isAlertGround ? "text-text-alert-strong" : "text-text-primary",
        )}
      >
        {formatDollars(remaining)}
      </p>
      <p className="text-body-small text-text-secondary [overflow-wrap:anywhere]">
        {`of ${formatDollars(total)} · ${percentUsed}% used${remaining < 0 ? " · over budget" : ""}`}
      </p>
      <ProgressBar
        value={percentUsed}
        tone={isAlertGround ? "alert" : "normal"}
        label={`${label} budget, ${percentUsed}% used`}
      />
    </CardShell>
  );
}
