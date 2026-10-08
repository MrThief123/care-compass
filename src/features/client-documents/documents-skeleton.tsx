import { CardShell } from "@/components/ui/card-shell";

/** Loading state: the screen's own shape (toolbar and a card of rows), with no data in it. */
export function DocumentsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy="true"
      className="flex flex-col gap-4 px-6 py-5"
    >
      <div aria-hidden className="h-11 w-full max-w-xl animate-pulse rounded-control bg-bg-inset" />
      <CardShell className="flex flex-col gap-3 p-3.75">
        {[0, 1, 2, 3].map((row) => (
          <div
            key={row}
            aria-hidden
            className="h-8 w-full animate-pulse rounded-full bg-bg-inset"
          />
        ))}
      </CardShell>
    </div>
  );
}
