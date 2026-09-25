"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps {
  /** Shown above the control and used as its accessible name. */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/**
 * On / Off switch (UI-05, forms kit). The word On / Off is shown so the state
 * is not carried by the thumb position or colour alone; the control is a
 * native button, so Space and Enter toggle it. Same markup and behaviour as
 * FAM-UI-03's local `TaskSwitch`, which it can replace:
 * `<Switch label="This is a task — must be ticked off" checked onChange />`.
 */
export function Switch({ label, checked, onChange, className }: SwitchProps) {
  const labelId = useId();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span id={labelId} className="text-body-default text-text-secondary">
        {label}
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
