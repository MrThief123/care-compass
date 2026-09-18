"use client";

import { useCallback, useEffect, useId, useRef } from "react";

import { cn } from "@/lib/utils";

import { Button } from "../../ui/button";
import { Icon } from "../../ui/icon";

import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";

export interface ConfirmationModalProps {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: "neutral" | "destructive";
  cancelLabel?: string;
  className?: string;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Neutral / destructive confirmation dialog (UI-02 Scope: `ConfirmationModal`).
 *
 * Rendered inline rather than through a portal so that an `axe` run over the
 * render container actually sees the dialog.
 */
export function ConfirmationModal({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  tone = "neutral",
  cancelLabel = "Cancel",
  className,
}: ConfirmationModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Remember what had focus before opening, then move focus to the first
  // control in the dialog — the close X, which is never the destructive action.
  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    return () => {
      triggerRef.current?.focus();
      triggerRef.current = null;
    };
  }, [open]);

  // Escape closes, wherever focus sits inside the dialog.
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  const trapTab = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;

    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (focusable.length === 0) return;

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trapTab}
        className={cn(
          "flex w-full max-w-md flex-col gap-4 rounded-card border border-border-default bg-bg-surface p-5",
          className,
        )}
      >
        <div className="flex items-start gap-2">
          <Icon
            name="alert-triangle"
            size={20}
            className={cn(
              "mt-0.5 shrink-0",
              tone === "destructive" ? "text-text-alert" : "text-text-brand",
            )}
          />
          <h2 id={titleId} className="text-title-section text-text-primary">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-text-secondary outline-none hover:bg-bg-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Icon name="x" size={20} aria-hidden />
          </button>
        </div>

        <div className="text-body-default text-text-secondary">{body}</div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "destructive" ? "destructive" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
