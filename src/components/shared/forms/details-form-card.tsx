import { cn } from "@/lib/utils";

import { Button } from "../../ui/button";
import { CardShell } from "../../ui/card-shell";

import type { ReactNode } from "react";

export interface DetailsFormCardProps {
  title: string;
  children: ReactNode;
  /**
   * Save affordance per OQ-35 (a Save button per card). Omitted for read-only
   * cards, which then render no button at all rather than a disabled one
   * (CLAUDE.md §7: disallowed controls are absent, not disabled).
   */
  onSave?: () => void;
  saveLabel?: string;
  className?: string;
}

/**
 * Card title over a two-column field grid — Family info, My info,
 * Organisation info (UI-02 Scope: `DetailsFormCard`).
 */
export function DetailsFormCard({
  title,
  children,
  onSave,
  saveLabel = "Save",
  className,
}: DetailsFormCardProps) {
  return (
    <CardShell className={cn("flex flex-col gap-4 p-5", className)}>
      <h3 className="text-title-card text-text-primary">{title}</h3>
      <div data-testid="details-form-grid" className="grid gap-4 sm:grid-cols-2">
        {children}
      </div>
      {onSave && (
        <div className="flex justify-end">
          <Button onClick={onSave}>{saveLabel}</Button>
        </div>
      )}
    </CardShell>
  );
}
