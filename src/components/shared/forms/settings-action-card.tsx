import { cn } from "@/lib/utils";

import { Button } from "../../ui/button";
import { CardShell } from "../../ui/card-shell";

export interface SettingsActionCardProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  className?: string;
}

/**
 * A settings row with one outline action — "Change organisation",
 * "Reset username / password" (UI-02 Scope: `SettingsActionCard`).
 */
export function SettingsActionCard({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: SettingsActionCardProps) {
  return (
    <CardShell className={cn("flex items-center justify-between gap-4 p-5", className)}>
      <div className="flex flex-col gap-1">
        <h3 className="text-title-card text-text-primary">{title}</h3>
        <p className="text-body-default text-text-secondary">{description}</p>
      </div>
      <Button variant="secondary" onClick={onAction} className="shrink-0">
        {actionLabel}
      </Button>
    </CardShell>
  );
}
