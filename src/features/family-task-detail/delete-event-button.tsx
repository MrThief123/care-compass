"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ChipGroup, ConfirmationModal } from "@/components/shared/forms";
import { deleteEventOccurrence } from "@/server/events/actions";

export interface DeleteEventButtonProps {
  clientId: string;
  eventId: string;
  /** The viewed occurrence's key; its original start is what gets deleted (PD-004). */
  occurrenceKey: string;
  /** A repeating event offers 'This occurrence' or 'This and all future occurrences' (FAM-18). */
  recurring: boolean;
  /** Where the viewer goes once it is deleted: the screen Task detail was opened from. */
  returnHref: string;
}

type DeleteScope = "occurrence" | "future";

const SCOPE_OPTIONS = [
  { value: "occurrence", label: "This occurrence" },
  { value: "future", label: "This and all future occurrences" },
];

/**
 * The outlined destructive twin of the 'Edit event' link: alert text and border, 44px tall and at
 * least 44px wide, as `EDIT_EVENT_BUTTON` is in `task-detail-view.tsx`.
 */
const DELETE_EVENT_BUTTON =
  "inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control border border-text-alert-strong bg-transparent px-4 py-2 text-sm font-medium text-text-alert-strong transition-colors outline-none hover:bg-bg-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

/**
 * FAM-18: 'Delete event' on Task detail. A one-off asks "Delete this event?"; a repeating event
 * adds the scope choice. On success the viewer returns to where they came from; on failure the
 * dialog stays open with the reason. Nothing is shown here that the viewer may not do: the page
 * renders this only for a viewer who can edit the event, and the database decides regardless.
 */
export function DeleteEventButton({
  clientId,
  eventId,
  occurrenceKey,
  recurring,
  returnHref,
}: DeleteEventButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<DeleteScope>("occurrence");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  function close() {
    setOpen(false);
    setScope("occurrence");
    setError(undefined);
  }

  async function confirm() {
    // The key is `<eventId>:<original start>` (PD-004); mock ids are not UUIDs, so cut by prefix.
    const prefix = `${eventId}:`;
    const originalStart = occurrenceKey.startsWith(prefix)
      ? occurrenceKey.slice(prefix.length)
      : undefined;
    if (!originalStart || busy) return;
    setBusy(true);
    setError(undefined);
    const result = await deleteEventOccurrence({
      clientId,
      eventId,
      occurrenceOriginalStart: originalStart,
      scope: recurring ? scope : "occurrence",
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.push(returnHref);
    router.refresh();
  }

  return (
    <>
      <button type="button" className={DELETE_EVENT_BUTTON} onClick={() => setOpen(true)}>
        Delete event
      </button>
      <ConfirmationModal
        open={open}
        tone="destructive"
        title={recurring ? "Delete this repeating event?" : "Delete this event?"}
        confirmLabel="Delete"
        onConfirm={confirm}
        onCancel={close}
        body={
          <div className="flex flex-col gap-3">
            <p>
              {recurring
                ? "Care already completed stays in the record."
                : "It will no longer show on the Calendar or in the Task log."}
            </p>
            {recurring && (
              <ChipGroup
                legend="Scope"
                hideLegend
                value={scope}
                onChange={(next) => setScope(next as DeleteScope)}
                options={SCOPE_OPTIONS}
              />
            )}
            <p role="alert" className="text-body-small text-text-alert-strong empty:hidden">
              {error}
            </p>
          </div>
        }
      />
    </>
  );
}
