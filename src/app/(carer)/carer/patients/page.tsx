import { CarerHomeErrorState } from "@/features/carer-home/carer-home-error-state";
import { CarerPatientsView } from "@/features/carer-patients/carer-patients-view";
import { getCurrentUser } from "@/server/auth/queries";
import { getCarerPatients, type CarerPatientRow } from "@/server/shifts/queries";

export default async function CarerPatientsPage() {
  const { profileId } = await getCurrentUser("carer");

  let patients: CarerPatientRow[];
  try {
    patients = await getCarerPatients(profileId);
  } catch (error) {
    // Log the error's class only: the message may carry client data (ARCHITECTURE.md §12.5).
    console.error(
      "[carer-patients] could not load patients:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <CarerHomeErrorState />;
  }

  return <CarerPatientsView patients={patients} />;
}
