"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

import { Icon } from "../../ui/icon";

import type { ReactNode } from "react";

export type FieldType = "text" | "email" | "tel" | "date" | "textarea" | "select";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: FieldType;
  /** Required for `type="select"`. */
  options?: FieldOption[];
  hint?: string;
  /** Inline error; also sets `aria-invalid` and the alert styling. */
  error?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  name?: string;
  /** Rendered inside the control, at the right — e.g. the date field's calendar icon. */
  adornment?: ReactNode;
  className?: string;
}

/** Shared control chrome: 44px target, token border, visible focus ring (REQ-N2). */
const CONTROL =
  "w-full rounded-control border bg-bg-surface px-3 text-body-default text-text-primary " +
  "outline-none placeholder:text-text-secondary " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
  "disabled:cursor-not-allowed disabled:opacity-50 read-only:cursor-default";

function controlTone(hasError: boolean): string {
  return hasError ? "border-border-alert" : "border-border-brand";
}

/**
 * Label + control + hint + inline error, for every form field in the app
 * (UI-02 Scope: `Field` wrappers).
 */
export function Field({
  label,
  value,
  onChange,
  type = "text",
  options,
  hint,
  error,
  required,
  readOnly,
  disabled,
  placeholder,
  name,
  adornment,
  className,
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const hasError = Boolean(error);

  // Hint first, then error: assistive tech reads the guidance before the problem.
  const describedBy =
    [hint ? hintId : null, hasError ? errorId : null].filter(Boolean).join(" ") || undefined;

  const shared = {
    id,
    name,
    value,
    required,
    readOnly,
    disabled,
    placeholder,
    "aria-describedby": describedBy,
    "aria-invalid": hasError || undefined,
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="text-body-default text-text-secondary">
        {label}
      </label>

      {type === "textarea" ? (
        <textarea
          {...shared}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          className={cn(CONTROL, controlTone(hasError), "min-h-24 py-2")}
        />
      ) : type === "select" ? (
        <div className="relative">
          <select
            {...shared}
            onChange={(event) => onChange(event.target.value)}
            className={cn(CONTROL, controlTone(hasError), "h-11 appearance-none pr-10")}
          >
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Icon
            name="chevron-down"
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-brand"
          />
        </div>
      ) : (
        <div className="relative">
          <input
            {...shared}
            type={type}
            onChange={(event) => onChange(event.target.value)}
            className={cn(CONTROL, controlTone(hasError), "h-11", adornment && "pr-10")}
          />
          {adornment && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-brand">
              {adornment}
            </span>
          )}
        </div>
      )}

      {hint && (
        <p id={hintId} className="text-body-small text-text-secondary">
          {hint}
        </p>
      )}
      {hasError && (
        <p id={errorId} className="text-body-small text-text-alert-strong">
          {error}
        </p>
      )}
    </div>
  );
}
