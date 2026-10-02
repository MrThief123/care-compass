"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { carerPatientBase } from "@/features/carer-patients/patient-routes";

/** Unknown or foreign event id: the Family copy, with the way back kept in the carer area. */
export default function CarerEventNotFound() {
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
        href={`${carerPatientBase(clientId)}/calendar`}
        className="inline-flex h-11 items-center self-start rounded-control px-4 text-body-emphasis text-text-brand underline-offset-4 hover:underline"
      >
        Back to Calendar
      </Link>
    </div>
  );
}
