import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth/queries";
import { getCarerPatients, type CarerPatientRow } from "@/server/shifts/queries";

/**
 * The signed-in carer's patient, or a redirect to their Patients list if they can't see
 * them (CAR-UI-02 AC-09, changed by CAR-04 FD-03: was not-found). Nothing about the
 * client is read for a URL that isn't theirs.
 */
export async function findCarerPatient(clientId: string): Promise<CarerPatientRow> {
  const { profileId } = await getCurrentUser("carer");
  const patient = (await getCarerPatients(profileId)).find((row) => row.clientId === clientId);
  if (!patient) redirect("/carer/patients");
  return patient;
}
