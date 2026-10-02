import { ViewOnlyNotice } from "@/features/carer-patients/edit-status";
import { findCarerPatient } from "@/features/carer-patients/find-patient";
import { carerPatientBase } from "@/features/carer-patients/patient-routes";
import { FamilyCalendarView } from "@/features/family-calendar/family-calendar-view";
import { loadFamilyCalendar } from "@/features/family-calendar/load-calendar";

/**
 * Carer · patient Calendar (CAR-06, CHG-043): the Family Calendar through the carer's account.
 * Tick boxes exist only while a shift with this patient is in progress; the database refuses a
 * tick outside one either way (`set_occurrence_done`). 'Enter event' (CAR-07, CHG-048) shows
 * under the same condition. A rejected read propagates to `error.tsx`.
 */
export default async function CarerPatientCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clientId } = await params;
  const patient = await findCarerPatient(clientId);
  const data = await loadFamilyCalendar(clientId, await searchParams, "carer");

  return (
    <>
      {!patient.onShift && <ViewOnlyNotice firstName={patient.firstName} purpose="tasks" />}
      <FamilyCalendarView
        clientId={clientId}
        today={data.today}
        params={data.params}
        occurrences={data.occurrences}
        log={data.log}
        actorName={data.actorName}
        basePath={carerPatientBase(clientId)}
        canTick={patient.onShift}
        canAddEvent={patient.onShift}
      />
    </>
  );
}
