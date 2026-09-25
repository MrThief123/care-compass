import { CardGridSkeleton } from "@/components/shared/states";

/**
 * Loading state for Add / Edit event: the heading, the field column and the
 * Pick a date card. Built from tokens; the States sheet has no form skeleton
 * (FD-05).
 */
export function EventFormSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-6 pb-6 pt-5" aria-busy="true">
      <div aria-hidden className="h-7 w-40 animate-pulse rounded-full bg-bg-surface" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10">
        <CardGridSkeleton count={4} className="grid-cols-1" />
        <CardGridSkeleton count={1} className="grid-cols-1" />
      </div>
    </div>
  );
}
