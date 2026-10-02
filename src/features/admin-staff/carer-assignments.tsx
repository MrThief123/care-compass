"use client";

import { useId, useState } from "react";

import { ConfirmationModal } from "@/components/shared/forms/confirmation-modal";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { removeCarerAssignment } from "@/server/admin/assignments-actions";
import type { CarerAssignment } from "@/server/admin/assignments-queries";

const REMOVE_FAILED = "Couldn't remove this client. Try again.";

/** "Mon 5 Oct" from a `YYYY-MM-DD` Melbourne date; read in UTC so the day never shifts. */
function shortDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function shiftSummary({ shiftCount, nextShift }: CarerAssignment): string {
  const shifts = shiftCount === 1 ? "1 shift" : `${shiftCount} shifts`;
  return `${shifts} · next ${shortDate(nextShift.date)}, ${nextShift.start}–${nextShift.end}`;
}

interface CarerAssignmentsProps {
  carer: { id: string; name: string };
  /** Every carer's assignments; this shows the selected carer's. */
  assignments: CarerAssignment[];
  /** Called after a removal succeeds, with the message to show. */
  onRemoved: (message: string) => void;
}

/**
 * The selected carer's clients with a Remove button each (ADM-08). Remove asks first, then ends
 * the pair through `removeCarerAssignment`: the carer's future shifts with that client are
 * cancelled and the one in progress ends now. Nothing is deleted. Built from tokens (no design,
 * OQ-19).
 */
export function CarerAssignments({ carer, assignments, onRemoved }: CarerAssignmentsProps) {
  const headingId = useId();
  const [removed, setRemoved] = useState<string[]>([]);
  const [pending, setPending] = useState<CarerAssignment | null>(null);
  const [error, setError] = useState("");

  const rows = assignments.filter(
    (row) => row.carerId === carer.id && !removed.includes(`${row.carerId}:${row.clientId}`),
  );

  async function confirmRemove() {
    const target = pending;
    if (!target) return;
    setPending(null);
    setError("");
    const outcome = await removeCarerAssignment({
      carerId: target.carerId,
      clientId: target.clientId,
    });
    if (!outcome.ok) {
      setError(outcome.error.message || REMOVE_FAILED);
      return;
    }
    setRemoved((current) => [...current, `${target.carerId}:${target.clientId}`]);
    onRemoved(
      `${target.clientName} removed from ${carer.name}. Their future shifts were cancelled.`,
    );
  }

  return (
    <CardShell className="border-transparent p-5">
      <section aria-labelledby={headingId} className="flex flex-col gap-3">
        <h3 id={headingId} className="text-title-card break-words text-text-primary">
          Clients for {carer.name}
        </h3>
        {error && (
          <p role="alert" className="text-body-small break-words text-destructive">
            {error}
          </p>
        )}
        {rows.length ? (
          <ul className="flex flex-col divide-y divide-border-default">
            {rows.map((row) => (
              <li
                key={row.clientId}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2"
              >
                <div className="min-w-0 flex-1 basis-40">
                  <p className="text-body-default break-words text-text-primary">
                    {row.clientName}
                  </p>
                  <p className="text-body-small break-words text-text-secondary">
                    {shiftSummary(row)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  aria-label={`Remove ${row.clientName} from ${carer.name}`}
                  onClick={() => {
                    setError("");
                    setPending(row);
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon="person"
            title="No clients assigned"
            body="This carer has no upcoming shifts with any client."
          />
        )}
      </section>
      <ConfirmationModal
        open={pending !== null}
        title="Remove carer from client?"
        body={
          pending
            ? `${carer.name} will no longer see ${pending.clientName}. Their future shifts together will be cancelled and any shift in progress will end now. Finished shifts stay in the history.`
            : ""
        }
        confirmLabel="Yes, remove"
        tone="destructive"
        onConfirm={() => void confirmRemove()}
        onCancel={() => setPending(null)}
      />
    </CardShell>
  );
}
