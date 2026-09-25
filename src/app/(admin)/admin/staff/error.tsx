"use client";
import { ErrorState } from "@/components/shared/states";

export default function StaffError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div role="alert" className="p-6">
      <ErrorState
        title="Unable to load staff"
        body="Please try loading the staff list again."
        onRetry={retry}
      />
    </div>
  );
}
