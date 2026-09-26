/** Loading state: the calendar's toolbar and grid frame, with no data (States sheet). */
export function CarerCalendarSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-5 px-6 pb-6 pt-4">
      <div aria-hidden className="flex items-center justify-between gap-3">
        <div className="h-7 w-56 animate-pulse rounded-full bg-bg-inset" />
        <div className="h-11 w-36 animate-pulse rounded-control bg-bg-inset" />
      </div>
      <div aria-hidden className="h-[520px] animate-pulse rounded-card bg-bg-surface" />
    </div>
  );
}
