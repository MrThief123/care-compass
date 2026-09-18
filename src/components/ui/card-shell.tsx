import { cn } from "@/lib/utils";

import type { HTMLAttributes } from "react";

export interface CardShellProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "neutral" | "alert";
}

export function CardShell({ tone = "neutral", className, children, ...props }: CardShellProps) {
  return (
    <div
      className={cn(
        "rounded-card border p-4",
        tone === "alert"
          ? "border-border-alert bg-bg-alert"
          : "border-border-default bg-bg-surface",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
