import { CardShell } from "@/components/ui/card-shell";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatMoney } from "@/lib/format/money";
import { cn } from "@/lib/utils";
import type { BudgetBucketSummary } from "@/types/domain";

export interface BudgetBucketCardProps {
  summary: BudgetBucketSummary;
  className?: string;
}

/**
 * One funding bucket: remaining, total and percent used (UI-03 PRD.md
 * Scope; PD-032 thresholds). "warning" keeps the neutral ground and adds
 * the alert icon; "alert"/"exhausted" move to the alert ground, ink and
 * bar tone — status is never colour alone (Figma component doc).
 */
export function BudgetBucketCard({ summary, className }: BudgetBucketCardProps) {
  const { label, total, remaining, percentUsed, state } = summary;
  const isTrouble = state !== "ok";
  const isAlertGround = state === "alert" || state === "exhausted";

  return (
    <CardShell
      tone={isAlertGround ? "alert" : "neutral"}
      className={cn("flex flex-col gap-1", className)}
    >
      <div className="flex items-center justify-between">
        <p className="text-label-caps text-text-secondary">{label}</p>
        {isTrouble && (
          <Icon
            name="alert-triangle"
            size={14}
            className={isAlertGround ? "text-text-alert-strong" : "text-text-alert"}
            aria-hidden
          />
        )}
      </div>
      <p
        className={cn(
          "text-metric-large",
          isAlertGround ? "text-text-alert-strong" : "text-text-primary",
        )}
      >
        {formatMoney(remaining)}
      </p>
      <p className="text-body-small text-text-secondary">
        of {formatMoney(total)} · {percentUsed}% used
      </p>
      <ProgressBar
        value={percentUsed}
        tone={isAlertGround ? "alert" : "normal"}
        label={`${label} budget, ${percentUsed}% used`}
      />
    </CardShell>
  );
}
