import { ListRowSkeleton } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";

/**
 * Loading state for the calendar: the same frame as `FamilyCalendarView`, so
 * nothing jumps when the data lands. Built from tokens, as the States sheet
 * draws only a list-row skeleton (DECISIONS.md FD-06).
 */
export function CalendarSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-5 px-6 pb-6 pt-5">
      <div aria-hidden className="flex items-center justify-between gap-3">
        <div className="h-7 w-56 animate-pulse rounded-full bg-bg-inset" />
        <div className="h-11 w-36 animate-pulse rounded-control bg-bg-inset" />
      </div>
      <div aria-hidden className="h-[520px] animate-pulse rounded-card bg-bg-surface" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <CardShell className="px-5 py-4">
          {Array.from({ length: 3 }, (_, index) => (
            <ListRowSkeleton key={index} />
          ))}
        </CardShell>
        <CardShell className="px-5 py-4">
          {Array.from({ length: 3 }, (_, index) => (
            <ListRowSkeleton key={index} />
          ))}
        </CardShell>
      </div>
    </div>
  );
}
