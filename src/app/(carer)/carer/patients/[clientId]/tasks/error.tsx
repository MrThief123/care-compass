"use client";

import { ErrorState } from "@/components/shared/states";

/**
 * Error state for the Task log and Task detail (ARCHITECTURE.md §12.5).
 * Next.js 16 passes `retry` (re-fetch and re-render the segment); `reset`
 * is now only for clearing the boundary without re-fetching (DECISIONS.md
 * FD-10). The message is generic; nothing from the error is shown or logged.
 */
export default function TasksError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="px-6 pb-6 pt-5">
      <ErrorState onRetry={retry} />
    </div>
  );
}
