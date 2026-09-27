import { notFound } from "next/navigation";

import { getCurrentUser } from "@/server/auth/queries";
import { getCarerPatients, type CarerPatientRow } from "@/server/shifts/queries";

/** The signed-in carer's patient, or Next.js not-found if they can't see them (AC-09). */
export async function findCarerPatient(clientId: string): Promise<CarerPatientRow> {
  const { profileId } = await getCurrentUser("carer");
  const patient = (await getCarerPatients(profileId)).find((row) => row.clientId === clientId);
  if (!patient) notFound();
  return patient;
}
