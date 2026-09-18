import { CardShell } from "@/components/ui/card-shell";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string;
  className?: string;
}

/** Label + Metric/Large number (UI-03 PRD.md Scope). */
export function StatCard({ label, value, className }: StatCardProps) {
  return (
    <CardShell className={cn("flex flex-col gap-1", className)}>
      <p className="text-label-caps text-text-secondary">{label}</p>
      <p className="text-metric-large text-text-primary">{value}</p>
    </CardShell>
  );
}
