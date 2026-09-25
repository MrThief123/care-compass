import { cn } from "@/lib/utils";
import type { FundEntry } from "@/types/domain";

import type { MouseEvent } from "react";

/** Opens an entry's details; `trigger` is the row's button, where focus returns on close. */
export type OpenEntryDetails = (entry: FundEntry, trigger: HTMLElement | null) => void;

/** A History or pending row that opens its entry's details when clicked anywhere (CHG-022). */
export const ENTRY_ROW =
  "min-h-11 cursor-pointer gap-y-1 border-b border-border-subtle py-2 last:border-b-0 hover:bg-bg-inset";

/**
 * The row's click handler. A click on the row's button, and Enter or Space on
 * it, bubble here too, so the details open once from any of them.
 */
export function openFromRow(entry: FundEntry, onOpen: OpenEntryDetails) {
  return (event: MouseEvent<HTMLElement>) =>
    onOpen(entry, event.currentTarget.querySelector("button"));
}

/**
 * The row's one control: its description, or "No description", as a button
 * that opens the entry's details (FD-13). Long text is cut to two lines by CSS
 * only, so the DOM, the button's name and `title` keep all of it (FD-09).
 */
export function DetailsButton({ description }: { description: string | undefined }) {
  return (
    <button
      type="button"
      className={cn(
        "block max-w-full cursor-pointer rounded-control text-left underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        !description && "text-text-secondary",
      )}
    >
      <span title={description || undefined} className="line-clamp-2 [overflow-wrap:anywhere]">
        {description || "No description"}
      </span>
    </button>
  );
}
