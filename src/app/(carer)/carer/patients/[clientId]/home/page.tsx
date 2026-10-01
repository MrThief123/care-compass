import { ViewOnlyNotice } from "@/features/carer-patients/edit-status";
import { findCarerPatient } from "@/features/carer-patients/find-patient";
import { carerPatientBase } from "@/features/carer-patients/patient-routes";
import { FamilyHomeView } from "@/features/family-home/family-home-view";
import { loadFamilyHomeData, type FamilyHomeData } from "@/features/family-home/home-data";
import { HomeErrorState } from "@/features/family-home/home-error-state";

/**
 * Carer · patient Home (CAR-06, CHG-043): the Family Home through the carer's account. Read-only:
 * no ticking, no Enter event, no budget 'View breakdown'. Off shift, the View only notice shows.
 */
export default async function CarerPatientHomePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  // Outside the try: redirect() throws and must reach Next.js.
  const patient = await findCarerPatient(clientId);

  let data: FamilyHomeData;
  try {
    data = await loadFamilyHomeData(clientId);
  } catch (error) {
    // CLAUDE.md §7: a feature tag and the error's class only, no PII.
    console.error(
      "[carer-patients] could not load home data:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <HomeErrorState />;
  }

  return (
    <>
      {!patient.onShift && <ViewOnlyNotice firstName={patient.firstName} purpose="tasks" />}
      <FamilyHomeView
        clientId={clientId}
        data={data}
        today={new Date()}
        basePath={carerPatientBase(clientId)}
        readOnly
      />
    </>
  );
}
