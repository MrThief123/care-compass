import { CarerHomeErrorState } from "@/features/carer-home/carer-home-error-state";
import { ViewOnlyNotice } from "@/features/carer-patients/edit-status";
import { findCarerPatient } from "@/features/carer-patients/find-patient";
import { FamilyInfoView } from "@/features/family-info/family-info-view";
import { loadFamilyInfoData, type FamilyInfoData } from "@/features/family-info/info-data";

export default async function PatientInfoPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  // Outside the try: notFound() throws and must reach Next.js.
  const patient = await findCarerPatient(clientId);

  let data: FamilyInfoData;
  try {
    data = await loadFamilyInfoData(clientId);
  } catch (error) {
    console.error(
      "[carer-patients] could not load info data:",
      error instanceof Error ? error.name : "unknown error",
    );
    return <CarerHomeErrorState />;
  }

  // OQ-09 default: carers edit client info only during a shift; otherwise the controls are absent.
  return (
    <>
      {!patient.onShift && <ViewOnlyNotice firstName={patient.firstName} />}
      <FamilyInfoView data={data} canEdit={patient.onShift} />
    </>
  );
}
