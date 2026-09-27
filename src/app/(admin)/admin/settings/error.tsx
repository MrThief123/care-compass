"use client";
import { ErrorState } from "@/components/shared/states";

export default function SettingsError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div role="alert" className="p-6">
      <ErrorState
        title="Unable to load settings"
        body="Please try loading your organisation settings again."
        onRetry={retry}
      />
    </div>
  );
}
