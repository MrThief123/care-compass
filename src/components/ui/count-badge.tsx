import { cn } from "@/lib/utils";

export interface CountBadgeProps {
  count: number;
  tone?: "neutral" | "alert";
  className?: string;
}

export function CountBadge({ count, tone = "neutral", className }: CountBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-label-caps normal-case leading-none",
        tone === "alert"
          ? "bg-bg-alert-badge text-text-alert-strong"
          : "bg-bg-inset text-text-secondary",
        className,
      )}
    >
      {count}
    </span>
  );
}
