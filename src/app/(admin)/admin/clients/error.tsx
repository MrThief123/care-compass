"use client";
import { ErrorState } from "@/components/shared/states";

export default function ClientsError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div role="alert" className="p-6">
      <ErrorState
        title="Unable to load clients"
        body="Please try loading the clients list again."
        onRetry={retry}
      />
    </div>
  );
}
