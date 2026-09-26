import { ListRowSkeleton } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";

/** Loading state (States sheet): the screen's two cards with row skeletons in place of data. */
export function CarerHomeSkeleton() {
  return (
    <div
      aria-busy="true"
      className="grid min-w-0 grid-cols-1 items-start gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
    >
      {[3, 3].map((rows, card) => (
        <CardShell key={card} className="min-w-0 p-5">
          <div aria-hidden className="h-5 w-32 animate-pulse rounded-full bg-bg-inset" />
          <div className="mt-4 flex flex-col gap-2">
            {Array.from({ length: rows }, (_, index) => (
              <ListRowSkeleton key={index} />
            ))}
          </div>
        </CardShell>
      ))}
    </div>
  );
}
