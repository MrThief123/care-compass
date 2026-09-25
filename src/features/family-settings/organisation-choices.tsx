"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";
import type { OrganisationChoice } from "@/server/clients/queries";

export interface OrganisationChoicesProps {
  organisations: OrganisationChoice[];
  /** The chosen organisation's id, or "" for none. */
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

/**
 * The list inside the Change organisation picker (FAM-13). The picker is not
 * designed (OQ-19), so this is built from the same tokens and radio-row pattern
 * as the event form's Paid from list. The client's current organisation is shown,
 * marked "Current" in words, and cannot be chosen (a disabled radio).
 */
export function OrganisationChoices({
  organisations,
  value,
  onChange,
  error,
}: OrganisationChoicesProps) {
  const groupName = useId();
  const legendId = `${groupName}-legend`;
  const errorId = `${groupName}-error`;

  return (
    <div className="flex flex-col gap-2">
      <span id={legendId} className="text-body-default text-text-secondary">
        Organisations registered with Care Compass
      </span>
      <div
        role="radiogroup"
        aria-labelledby={legendId}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        className="flex max-h-64 flex-col gap-2 overflow-y-auto"
      >
        {organisations.map((organisation) => (
          <label
            key={organisation.id}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-control border bg-bg-surface px-3 py-2",
              "has-[:checked]:bg-bg-inset has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
              error ? "border-border-alert" : "border-border-brand",
              organisation.isCurrent ? "cursor-not-allowed" : "cursor-pointer",
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={organisation.id}
              checked={value === organisation.id}
              disabled={organisation.isCurrent}
              onChange={() => onChange(organisation.id)}
              className="size-5 shrink-0 accent-primary"
            />
            <span
              className={cn(
                "min-w-0 break-words text-body-emphasis",
                organisation.isCurrent ? "text-text-secondary" : "text-text-primary",
              )}
            >
              {organisation.name}
            </span>
            {organisation.isCurrent && (
              <span className="ml-auto shrink-0 text-body-default text-text-secondary">
                Current
              </span>
            )}
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="text-body-small text-text-alert-strong">
          {error}
        </p>
      )}
    </div>
  );
}
