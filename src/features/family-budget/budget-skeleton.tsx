import { CardShell } from "@/components/ui/card-shell";
import { cn } from "@/lib/utils";

function Bar({ className }: { className: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-full bg-bg-inset", className)} />;
}

/**
 * Loading state (States sheet): the screen's own shape, the two cards, with no
 * data in it, so nothing jumps when the content arrives. One labelled status
 * for the whole screen; the bars are hidden from assistive technology.
 */
export function BudgetSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy="true"
      className="flex flex-col gap-[22px] px-6 py-5"
    >
      <CardShell className="p-5">
        <div className="flex min-h-11 items-center justify-between gap-4">
          <Bar className="h-5 w-36" />
          <Bar className="h-11 w-24 rounded-control" />
        </div>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} aria-hidden className="h-32 animate-pulse rounded-card bg-bg-inset" />
          ))}
        </div>
      </CardShell>
      <CardShell className="p-5">
        <Bar className="h-5 w-20" />
        <div className="mt-4 flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Bar key={index} className="h-4 w-full" />
          ))}
        </div>
      </CardShell>
    </div>
  );
}
