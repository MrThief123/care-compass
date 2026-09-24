"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";

/**
 * Shown when `notFound()` is thrown for an unknown or foreign event id
 * (ARCHITECTURE.md §12.5). Design-gap copy built from tokens (FD-05).
 */
export default function EventNotFound() {
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <div className="flex flex-col gap-4 px-6 pb-6 pt-5">
      <CardShell>
        <EmptyState
          icon="search"
          title="Event not found"
          body="We couldn't find that event. It may have been removed."
        />
      </CardShell>
      <Link
        href={`/family/${encodeURIComponent(clientId)}/calendar`}
        className="inline-flex h-11 items-center self-start rounded-control px-4 text-body-emphasis text-text-brand underline-offset-4 hover:underline"
      >
        Back to Calendar
      </Link>
    </div>
  );
}
