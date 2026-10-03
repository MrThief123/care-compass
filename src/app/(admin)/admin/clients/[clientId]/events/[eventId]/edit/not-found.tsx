"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { adminClientBase } from "@/features/admin-client-view/client-routes";

/** Unknown or foreign event id: the Family copy, with the way back kept in the admin client view. */
export default function AdminEventNotFound() {
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
        href={`${adminClientBase(clientId)}/calendar`}
        className="inline-flex h-11 items-center self-start rounded-control px-4 text-body-emphasis text-text-brand underline-offset-4 hover:underline"
      >
        Back to Calendar
      </Link>
    </div>
  );
}
