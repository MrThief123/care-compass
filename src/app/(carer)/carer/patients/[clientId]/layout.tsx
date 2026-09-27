import { findCarerPatient } from "@/features/carer-patients/find-patient";
import { PatientHeader } from "@/features/carer-patients/patient-header";

import type { ReactNode } from "react";

export default async function PatientLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const patient = await findCarerPatient((await params).clientId);

  return (
    <>
      <PatientHeader patient={patient} />
      {children}
    </>
  );
}
