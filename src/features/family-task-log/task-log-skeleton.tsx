import { ListRowSkeleton } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";

/**
 * Loading state for the Task log (PRD Scope: skeleton wired to the query's
 * loading state). Same frame as `TaskLogView`, so the layout does not jump;
 * the title is real text, the controls and rows are placeholders. The States
 * sheet only shows a list-row skeleton, so the frame is built from tokens
 * (DECISIONS.md FD-08).
 */
export function TaskLogSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-6 pb-6 pt-5">
      <h1 className="text-title-page text-text-primary">Task log</h1>

      <div aria-hidden className="flex items-start gap-3">
        <div className="h-11 min-w-0 flex-1 animate-pulse rounded-control bg-bg-surface" />
        <div className="h-[68px] w-[220px] shrink-0 animate-pulse rounded-control bg-bg-surface" />
      </div>

      <CardShell className="px-4 py-3">
        {Array.from({ length: 6 }, (_, index) => (
          <ListRowSkeleton key={index} />
        ))}
      </CardShell>
    </div>
  );
}
