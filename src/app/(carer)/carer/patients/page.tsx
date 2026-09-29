import { CarerHomeErrorState } from "@/features/carer-home/carer-home-error-state";
import { CarerPatientsView } from "@/features/carer-patients/carer-patients-view";
import { getCurrentUser } from "@/server/auth/queries";
import { getCarerPatients, type CarerPatientRow } from "@/server/shifts/queries";

/** A search longer than this is cut, so a hostile URL cannot make a huge query. */
const MAX_QUERY_LENGTH = 200;

export default async function CarerPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { profileId } = await getCurrentUser("carer");
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim().slice(0, MAX_QUERY_LENGTH).trim() ?? "";

  let patients: CarerPatientRow[];
  try {
    patients = await getCarerPatients(profileId, query);
  } catch (error) {
    // Log the error's class only: the message may carry client data (ARCHITECTURE.md §12.5).
    console.error(
      "[carer-patients] could not load patients:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <CarerHomeErrorState />;
  }

  return <CarerPatientsView patients={patients} query={query} />;
}
