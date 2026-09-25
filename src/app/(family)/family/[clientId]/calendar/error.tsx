"use client";

import { ErrorState } from "@/components/shared/states";

/**
 * Error state for the calendar (ARCHITECTURE.md §12.5). Next.js 16 passes
 * `retry` (re-fetch and re-render the segment). The message is generic;
 * nothing from the error is shown or logged.
 */
export default function CalendarError({
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
