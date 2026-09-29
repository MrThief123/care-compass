"use client";
import { ErrorState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";

export function ManageLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="grid gap-5 p-6 lg:grid-cols-[290px_290px_minmax(0,1fr)]"
    >
      <span className="sr-only">Loading Manage</span>
      {[0, 1, 2].map((key) => (
        <CardShell key={key} aria-hidden className="min-h-80 animate-pulse border-transparent" />
      ))}
    </div>
  );
}
export function ManageError({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="p-6">
      <CardShell>
        <ErrorState
          title="Unable to load Manage"
          body="We couldn't load staff, clients and shifts. Please try again."
          onRetry={retry}
        />
      </CardShell>
    </div>
  );
}
