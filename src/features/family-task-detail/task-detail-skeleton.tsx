import { CardGridSkeleton } from "@/components/shared/states";

/**
 * Loading state for Task detail: placeholders for the heading block and the
 * three stacked cards. Built from tokens because the States sheet only
 * shows list-row and card-grid skeletons (DECISIONS.md FD-08).
 */
export function TaskDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-6 pb-6 pt-2">
      <div aria-hidden className="flex flex-col gap-2 pt-3">
        <div className="h-5 w-32 animate-pulse rounded-full bg-bg-surface" />
        <div className="h-6 w-64 animate-pulse rounded-full bg-bg-surface" />
        <div className="h-4 w-80 animate-pulse rounded-full bg-bg-surface" />
      </div>
      <CardGridSkeleton count={3} className="grid-cols-1" />
    </div>
  );
}
