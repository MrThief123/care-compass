"use client";

import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";

/** Shown in place of the screen when the documents read rejects. Retry re-runs the server read. */
export function DocumentsErrorState() {
  const router = useRouter();

  return (
    <div className="px-6 py-5">
      <CardShell>
        <ErrorState onRetry={() => router.refresh()} />
      </CardShell>
    </div>
  );
}
