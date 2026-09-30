import { CarerHomeErrorState } from "@/features/carer-home/carer-home-error-state";
import { CarerInfoView } from "@/features/carer-patients/carer-info-view";
import { ViewOnlyNotice } from "@/features/carer-patients/edit-status";
import { findCarerPatient } from "@/features/carer-patients/find-patient";
import { loadFamilyInfoData, type FamilyInfoData } from "@/features/family-info/info-data";

export default async function PatientInfoPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  // Outside the try: redirect() throws and must reach Next.js.
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

  // PD-041: a carer edits client info and adds documents only while a shift is in progress;
  // otherwise the controls are absent (RLS refuses the writes either way).
  return (
    <>
      {!patient.onShift && <ViewOnlyNotice firstName={patient.firstName} />}
      <CarerInfoView clientId={clientId} data={data} canEdit={patient.onShift} />
    </>
  );
}
