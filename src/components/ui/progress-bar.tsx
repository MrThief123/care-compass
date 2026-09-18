import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  /** 0-100. */
  value: number;
  tone?: "normal" | "alert";
  label: string;
  className?: string;
}

export function ProgressBar({ value, tone = "normal", label, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-bg-inset", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width]",
          tone === "alert" ? "bg-bg-alert-strong" : "bg-bg-brand",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
