import { CardShell } from "@/components/ui/card-shell";
import { cn } from "@/lib/utils";

function Bar({ className }: { className: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-full bg-bg-inset", className)} />;
}

function ActionCardSkeleton() {
  return (
    <CardShell className="flex items-center justify-between gap-4 p-5">
      <div className="flex flex-1 flex-col gap-2">
        <Bar className="h-4 w-40" />
        <Bar className="h-3.5 w-2/3" />
      </div>
      <div aria-hidden className="h-11 w-24 shrink-0 animate-pulse rounded-control bg-bg-inset" />
    </CardShell>
  );
}

/**
 * Loading state (FD-05): the three cards' shape with no data, one labelled
 * status for the whole screen; the bars are hidden from assistive tech.
 */
export function SettingsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy="true"
      className="flex flex-col gap-[22px] px-6 py-5"
    >
      <Bar className="h-7 w-32" />
      <ActionCardSkeleton />
      <CardShell className="flex flex-col gap-4 p-5">
        <Bar className="h-4 w-28" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex flex-col gap-1">
              <Bar className="h-3.5 w-20" />
              <div aria-hidden className="h-11 animate-pulse rounded-control bg-bg-inset" />
            </div>
          ))}
        </div>
      </CardShell>
      <ActionCardSkeleton />
    </div>
  );
}
