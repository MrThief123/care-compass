"use client";

import { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import type { BudgetBucketSummary, FundEntry } from "@/types/domain";

import { bucketName, fundStatus, NOT_RECORDED } from "./budget-export";
import { formatFundDate, formatSignedDollars } from "./budget-format";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";

export interface EntryDetailsDialogProps {
  entry: FundEntry;
  buckets: BudgetBucketSummary[];
  /** The row's button: focus goes back to it on close, however the dialog was opened. */
  returnFocusTo: HTMLElement | null;
  onClose: () => void;
}

/**
 * One History or pending entry's details (CHG-022, PD-060, DECISIONS.md FD-13):
 * a modal dialog titled with the description, listing Date, Bucket, Amount,
 * Status, Recorded by and, only when there is one, Note. Undesigned (PD-052),
 * built from tokens. Follows the kit's `ConfirmationModal` focus pattern
 * locally (`src/components/shared` is not lane F's): inline, so axe sees it;
 * focus moves to Close on open, Tab stays inside (Close is its only control),
 * Escape or Close closes, and focus returns to the row's button.
 */
export function EntryDetailsDialog({
  entry,
  buckets,
  returnFocusTo,
  onClose,
}: EntryDetailsDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.querySelector("button")?.focus();
    return () => returnFocusTo?.focus();
  }, [returnFocusTo]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close is the dialog's only control, so Tab and Shift+Tab stay on it.
  const trapTab = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Tab") event.preventDefault();
  };

  const note = entry.note?.trim();
  const details: [string, string][] = [
    ["Date", formatFundDate(entry.date)],
    ["Bucket", bucketName(entry, buckets)],
    ["Amount", formatSignedDollars(entry.amount)],
    ["Status", fundStatus(entry, formatFundDate)],
    ["Recorded by", entry.recordedBy?.trim() || NOT_RECORDED],
    ...(note ? [["Note", note] as [string, string]] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trapTab}
        className="flex max-h-full w-full max-w-md flex-col gap-4 overflow-y-auto rounded-card border border-border-default bg-bg-surface p-5"
      >
        <h2
          id={titleId}
          className="min-w-0 text-title-section text-text-primary [overflow-wrap:anywhere]"
        >
          {entry.description?.trim() || "No description"}
        </h2>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-body-default">
          {details.map(([term, value]) => (
            <div key={term} className="contents">
              <dt className="text-text-secondary">{term}</dt>
              <dd className="min-w-0 whitespace-pre-wrap text-text-primary [overflow-wrap:anywhere]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
