import { CardGridSkeleton, ListRowSkeleton } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { cn } from "@/lib/utils";

function TitleBar({ className }: { className: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-full bg-bg-inset", className)} />;
}

/**
 * Loading state (States sheet): the screen's own shape, with the kit's row and
 * card skeletons in place of data, so nothing jumps when the content arrives.
 */
export function HomeSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4 px-6 py-5">
      <div className="flex items-stretch gap-4">
        <CardShell className="min-w-0 flex-1 p-5">
          <TitleBar className="h-5 w-16" />
          <div className="mt-4 flex flex-col gap-4">
            {Array.from({ length: 4 }, (_, index) => (
              <ListRowSkeleton key={index} />
            ))}
          </div>
        </CardShell>
        <div className="flex w-[340px] shrink-0 flex-col gap-4">
          <div aria-hidden className="h-13 animate-pulse rounded-control bg-bg-inset" />
          <CardShell>
            <TitleBar className="h-5 w-20" />
            {Array.from({ length: 3 }, (_, index) => (
              <ListRowSkeleton key={index} />
            ))}
          </CardShell>
          <CardShell>
            <TitleBar className="h-5 w-32" />
            {Array.from({ length: 5 }, (_, index) => (
              <ListRowSkeleton key={index} />
            ))}
          </CardShell>
        </div>
      </div>
      <CardShell className="p-5">
        <TitleBar className="h-5 w-24" />
        <CardGridSkeleton className="mt-4" />
      </CardShell>
    </div>
  );
}
