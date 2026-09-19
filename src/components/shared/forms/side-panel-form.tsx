"use client";

import { cn } from "@/lib/utils";

import { Button } from "../../ui/button";

import type { FormEvent, ReactNode } from "react";

export interface SidePanelFormProps {
  title: string;
  children: ReactNode;
  submitLabel: string;
  onSubmit: () => void;
  /** Optional secondary action under the primary button. */
  onCancel?: () => void;
  cancelLabel?: string;
  className?: string;
}

/**
 * Panel title, stacked fields, full-width primary button at the bottom —
 * Add / edit staff, Add client (UI-02 Scope: `SidePanelForm`).
 *
 * A real `<form>` so Enter submits from any field, which a div with a click
 * handler would not do.
 */
export function SidePanelForm({
  title,
  children,
  submitLabel,
  onSubmit,
  onCancel,
  cancelLabel = "Cancel",
  className,
}: SidePanelFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex h-full flex-col gap-4 rounded-card border border-border-default bg-bg-surface p-5",
        className,
      )}
    >
      <h3 className="text-title-card text-text-primary">{title}</h3>
      <div className="flex flex-1 flex-col gap-4">{children}</div>
      <div className="flex flex-col gap-2">
        <Button type="submit" className="w-full">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="w-full">
            {cancelLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
