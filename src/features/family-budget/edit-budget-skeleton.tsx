import { CardShell } from "@/components/ui/card-shell";
import { cn } from "@/lib/utils";

function Bar({ className }: { className: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-full bg-bg-inset", className)} />;
}

/**
 * Edit budget's loading state (CHG-021): the page's shape, a title bar and a
 * few bucket panels, with no data in it. One labelled status for the page; the
 * bars are hidden from assistive technology.
 */
export function EditBudgetSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy="true"
      className="flex flex-col gap-5 px-6 pb-6 pt-5"
    >
      <Bar className="h-8 w-48" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <CardShell key={index} className="p-5">
            <Bar className="h-5 w-32" />
            <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-4">
              <Bar className="h-11 w-full rounded-control" />
              <Bar className="h-11 w-full rounded-control" />
              <Bar className="h-11 w-full rounded-control" />
            </div>
          </CardShell>
        ))}
      </div>
    </div>
  );
}
