import { CardShell } from "@/components/ui/card-shell";
import { cn } from "@/lib/utils";

function Bar({ className }: { className: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-full bg-bg-inset", className)} />;
}

function TextCardSkeleton() {
  return (
    <CardShell className="flex flex-col gap-2.5 p-3.75">
      <div className="flex min-h-11 items-center">
        <Bar className="h-4 w-28" />
      </div>
      <Bar className="h-3.5 w-full" />
      <Bar className="h-3.5 w-2/3" />
    </CardShell>
  );
}

/**
 * Loading state (States sheet): the screen's own shape, the name line and the
 * four cards, with no data in it, so nothing jumps when the content arrives.
 * One labelled status for the whole screen; the bars are hidden from assistive tech.
 */
export function InfoSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy="true"
      className="flex flex-col gap-[22px] px-6 py-5"
    >
      <div className="mb-4 flex items-center gap-4">
        <div
          aria-hidden
          className="h-[46px] w-[46px] shrink-0 animate-pulse rounded-full bg-bg-inset"
        />
        <div className="flex flex-col gap-1.5">
          <Bar className="h-4 w-28" />
          <Bar className="h-3 w-52" />
        </div>
      </div>
      <TextCardSkeleton />
      <TextCardSkeleton />
      <TextCardSkeleton />
      <CardShell className="flex flex-col gap-2.5 p-3.75">
        <Bar className="h-4 w-32" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              aria-hidden
              className="h-26 w-26 animate-pulse rounded-card bg-bg-inset"
            />
          ))}
        </div>
      </CardShell>
    </div>
  );
}
