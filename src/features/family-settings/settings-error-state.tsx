"use client";

import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";

/**
 * Shown in place of the screen when a contract read rejects (FD-05). Retry
 * asks the server to render the route again, which re-runs the reads.
 */
export function SettingsErrorState() {
  const router = useRouter();

  return (
    <div className="px-6 py-5">
      <CardShell>
        <ErrorState onRetry={() => router.refresh()} />
      </CardShell>
    </div>
  );
}
