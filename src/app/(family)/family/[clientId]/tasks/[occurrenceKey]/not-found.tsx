"use client";

import { useParams } from "next/navigation";

import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { BackToTaskLogLink } from "@/features/family-task-detail/back-to-task-log-link";

/**
 * Shown when `notFound()` is thrown for an unknown or foreign occurrence key
 * (ARCHITECTURE.md §12.5: `not-found.tsx` for invalid ids). The copy is a
 * design gap built from tokens (DECISIONS.md FD-08).
 */
export default function TaskNotFound() {
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <div className="flex flex-col gap-4 px-6 pb-6 pt-2">
      <BackToTaskLogLink clientId={clientId} />
      <CardShell>
        <EmptyState
          icon="search"
          title="Task not found"
          body="We couldn't find that task. It may have been removed."
        />
      </CardShell>
    </div>
  );
}
