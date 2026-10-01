"use client";

import { useParams } from "next/navigation";

import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { carerPatientBase } from "@/features/carer-patients/patient-routes";
import { BackLink } from "@/features/family-task-detail/back-link";

/** Unknown or foreign occurrence key: the Family copy, with Back kept in the carer area. */
export default function CarerTaskNotFound() {
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <div className="flex flex-col gap-4 px-6 pb-6 pt-2">
      <BackLink clientId={clientId} basePath={carerPatientBase(clientId)} />
      <CardShell>
        <EmptyState
          icon="search"
          title="Task not found"
          body="We couldn't find that task. It may have been removed."
        />
      </CardShell>
    </div>
  );
}
