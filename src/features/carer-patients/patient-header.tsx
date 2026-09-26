import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import type { CarerPatientRow } from "@/server/shifts/queries";

import { patientMeta } from "./patient-meta";
import { PatientTabs } from "./patient-tabs";

/** Back link, who the patient is, and their tabs, above every patient tab (CHG-028). */
export function PatientHeader({ patient }: { patient: CarerPatientRow }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border-default bg-bg-surface px-6 pt-4">
      <Link
        href="/carer/patients"
        className="flex min-h-11 w-fit items-center gap-1 rounded-control text-body-default text-text-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Icon name="chevron-left" size={16} aria-hidden />
        Back to patients
      </Link>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={patient.firstName} size="lg" />
        <div className="min-w-0">
          <p className="break-words text-title-card text-text-primary">{patient.firstName}</p>
          <p className="text-body-small text-text-secondary">{patientMeta(patient)}</p>
        </div>
      </div>
      <PatientTabs clientId={patient.clientId} firstName={patient.firstName} />
    </div>
  );
}
