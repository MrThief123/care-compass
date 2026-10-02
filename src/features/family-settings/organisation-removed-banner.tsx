import { useId, type ReactNode } from "react";

import { CardShell } from "@/components/ui/card-shell";

/**
 * ADM-05 (FD-04): shown on Family Settings and Home when the organisation has removed the client,
 * until the family chooses a new one. A persistent banner, not a toast or notification. `action` is
 * the Choose organisation button (Settings) or link (Home). Built from tokens (design gap, PD-052).
 */
export function OrganisationRemovedBanner({
  clientFirstName,
  action,
}: {
  clientFirstName: string;
  action: ReactNode;
}) {
  const titleId = useId();
  return (
    <CardShell
      tone="alert"
      role="region"
      aria-labelledby={titleId}
      className="flex min-w-0 flex-col gap-3 p-4 [overflow-wrap:anywhere] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p id={titleId} className="text-title-card text-text-alert-strong">
          Organisation removed
        </p>
        <p className="text-body-default text-text-primary">
          Your organisation has removed {clientFirstName}. Choose a new organisation so{" "}
          {clientFirstName}&apos;s care can continue.
        </p>
      </div>
      <div className="shrink-0">{action}</div>
    </CardShell>
  );
}
