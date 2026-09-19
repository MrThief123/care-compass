import { cn } from "@/lib/utils";

import { Icon } from "../../ui/icon";

import type { ReactNode } from "react";

export interface InlineAlertProps {
  children: ReactNode;
  /** `polite` for a message that appears as a side effect of another change. */
  live?: "assertive" | "polite";
  className?: string;
}

/**
 * Warning banner inside a form — the shift overlap message
 * (UI-02 Scope: `InlineAlert`). The icon carries the meaning alongside the
 * colour, never colour alone (REQ-N2).
 */
export function InlineAlert({ children, live = "polite", className }: InlineAlertProps) {
  return (
    <div
      role="alert"
      aria-live={live}
      className={cn(
        "flex items-start gap-2 rounded-card border border-border-alert bg-bg-alert p-3",
        className,
      )}
    >
      <Icon name="alert-triangle" size={20} className="mt-0.5 shrink-0 text-text-alert" />
      <p className="text-body-default text-text-alert-strong">{children}</p>
    </div>
  );
}
