import { CardShell } from "@/components/ui/card-shell";

/** Loading state (States sheet): the search bar and grid shape, no data. */
export function CarerPatientsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy="true"
      className="flex flex-col gap-4 px-6 py-5"
    >
      <div aria-hidden className="h-11 animate-pulse rounded-control bg-bg-inset" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <CardShell
            key={index}
            className="flex min-h-56 flex-col items-center justify-center gap-2"
          >
            <div aria-hidden className="h-[46px] w-[46px] animate-pulse rounded-full bg-bg-inset" />
            <div aria-hidden className="h-4 w-24 animate-pulse rounded-full bg-bg-inset" />
            <div aria-hidden className="h-3 w-32 animate-pulse rounded-full bg-bg-inset" />
          </CardShell>
        ))}
      </div>
    </div>
  );
}
