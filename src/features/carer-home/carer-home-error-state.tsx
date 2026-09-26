"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { Icon } from "@/components/ui/icon";

/**
 * Shown in place of the whole screen when a contract query rejects. Same look
 * as the kit's `ErrorState`, but AC-08 names the button 'Try again' and the
 * kit's reads 'Retry' (FD-05). Try again re-renders the route on the server,
 * which re-runs the queries.
 */
export function CarerHomeErrorState() {
  const router = useRouter();

  return (
    <div className="px-6 py-5">
      <CardShell>
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Icon name="alert-triangle" size={20} className="text-text-alert" aria-hidden />
          <p className="text-title-card text-text-primary">Something went wrong</p>
          <p className="text-body-default text-text-secondary">
            We couldn&apos;t load this page. Please try again.
          </p>
          <Button variant="secondary" size="md" onClick={() => router.refresh()} className="mt-2">
            Try again
          </Button>
        </div>
      </CardShell>
    </div>
  );
}
