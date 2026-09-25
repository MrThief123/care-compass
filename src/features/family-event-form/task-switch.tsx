"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

export interface TaskSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * "This is a task — must be ticked off" (CHG-009). On: a task, ticked off by
 * hand and Overdue if missed. Off: a plain event with no status. The word
 * On / Off is shown so the state is not carried by the thumb position or
 * colour alone. The kit has no switch, so it lives here until one is shared.
 */
export function TaskSwitch({ checked, onChange }: TaskSwitchProps) {
  const labelId = useId();

  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-body-default text-text-secondary">
        This is a task — must be ticked off
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        onClick={() => onChange(!checked)}
        className="flex min-h-11 w-fit items-center gap-3 rounded-control py-1 pr-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span
          aria-hidden
          className={cn(
            "flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors",
            checked ? "border-primary bg-primary" : "border-border-default bg-bg-surface",
          )}
        >
          <span
            className={cn(
              "h-4.5 w-4.5 rounded-full shadow-sm transition-transform",
              checked ? "translate-x-5 bg-bg-surface" : "bg-text-secondary",
            )}
          />
        </span>
        <span className="text-body-emphasis text-text-primary">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}
