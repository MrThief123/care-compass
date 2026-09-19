"use client";

import { cn } from "@/lib/utils";

export interface ChipOption {
  value: string;
  label: string;
  /** Present but not choosable — e.g. Overdue, which is derived (PD-044). */
  disabled?: boolean;
}

export interface ChipGroupProps {
  legend: string;
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  /** Hide the visible legend but keep it as the group's accessible name. */
  hideLegend?: boolean;
  className?: string;
}

/**
 * Single-select chips (UI-02 Scope: `ChipGroup`). Implemented as a radiogroup so
 * the whole set is one tab stop and arrow keys move between chips, which plain
 * buttons would not give.
 */
export function ChipGroup({
  legend,
  options,
  value,
  onChange,
  hideLegend,
  className,
}: ChipGroupProps) {
  const selectable = options.filter((option) => !option.disabled);

  function moveBy(step: number) {
    const index = selectable.findIndex((option) => option.value === value);
    const next = selectable[(index + step + selectable.length) % selectable.length];
    if (next) onChange(next.value);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span
        id={`${legend}-legend`}
        className={cn("text-body-default text-text-secondary", hideLegend && "sr-only")}
      >
        {legend}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${legend}-legend`}
        className="flex flex-wrap gap-2"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            event.preventDefault();
            moveBy(1);
          } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            event.preventDefault();
            moveBy(-1);
          }
        }}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={option.disabled}
              // Roving tabindex: only the selected chip is in the tab order.
              tabIndex={selected ? 0 : -1}
              onClick={() => {
                if (!option.disabled) onChange(option.value);
              }}
              className={cn(
                "h-11 rounded-control border px-4 text-body-default transition-colors",
                "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                selected
                  ? "border-border-brand bg-primary text-primary-foreground"
                  : "border-border-brand bg-bg-surface text-text-primary hover:bg-bg-inset",
                option.disabled && "cursor-not-allowed opacity-50 hover:bg-bg-surface",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
