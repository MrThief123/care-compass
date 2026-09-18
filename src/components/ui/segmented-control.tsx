"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export type SegmentedControlOption = "D" | "W" | "M";

const OPTIONS: SegmentedControlOption[] = ["D", "W", "M"];

export interface SegmentedControlProps {
  value?: SegmentedControlOption;
  onChange?: (value: SegmentedControlOption) => void;
  className?: string;
}

export function SegmentedControl({ value, onChange, className }: SegmentedControlProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState<SegmentedControlOption>("W");
  const selected = value ?? uncontrolledValue;

  function select(option: SegmentedControlOption) {
    if (value === undefined) setUncontrolledValue(option);
    onChange?.(option);
  }

  return (
    <div
      role="radiogroup"
      aria-label="View"
      className={cn("inline-flex rounded-control border border-border-default p-0.5", className)}
    >
      {OPTIONS.map((option) => {
        const isSelected = option === selected;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => select(option)}
            className={cn(
              "min-h-9 min-w-9 rounded-inset px-3 text-body-emphasis transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-text-secondary hover:bg-bg-inset",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
