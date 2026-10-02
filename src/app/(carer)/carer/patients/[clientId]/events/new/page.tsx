import { redirect } from "next/navigation";

import { findCarerPatient } from "@/features/carer-patients/find-patient";
import { carerPatientBase } from "@/features/carer-patients/patient-routes";
import { addEventReturnHref } from "@/features/family-event-form/event-form-return";
import { EventFormScreen } from "@/features/family-event-form/event-form-screen";
import { EMPTY_EVENT_VALUES, isTaskEvent } from "@/features/family-event-form/event-form-values";
import { resolveTaskDetailOrigin } from "@/features/family-task-detail/task-detail-origin";
import { melbourneDateKey } from "@/features/family-task-log/melbourne-time";
import { getBudgetSummary } from "@/server/budget/queries";
import { getOccurrences, getToday } from "@/server/events/queries";

/** The first and last day (inclusive) of the calendar month a `YYYY-MM-DD` date falls in. */
function monthBounds(anyDateInMonth: string): { from: string; to: string } {
  const [year, month] = anyDateInMonth.split("-").map(Number) as [number, number];
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${pad(lastDay)}` };
}

/** Days in the shown month that already have an occurrence, for "Pick a date"'s dots. */
async function datesWithItemsFor(clientId: string, month: string): Promise<string[]> {
  const occurrences = await getOccurrences(clientId, monthBounds(month), { type: "all" });
  return [...new Set(occurrences.map((occurrence) => melbourneDateKey(occurrence.start)))];
}

/**
 * Carer · Add event (CAR-07, CHG-048): the Family form under the carer's own path. Only while a
 * shift with this patient is in progress; otherwise the carer goes to the patient's Calendar
 * (which says why), before any event or budget data is read. Save and Cancel return to the
 * Calendar view it was opened from, else the patient's Home.
 */
export default async function CarerNewEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clientId } = await params;
  const patient = await findCarerPatient(clientId);
  const base = carerPatientBase(clientId);
  if (!patient.onShift) redirect(`${base}/calendar`);

  const month = melbourneDateKey(new Date().toISOString());
  const [origin, buckets, datesWithItems] = await Promise.all([
    searchParams.then((raw) => resolveTaskDetailOrigin(raw, () => getToday())),
    getBudgetSummary(clientId),
    datesWithItemsFor(clientId, month),
  ]);
  return (
    <EventFormScreen
      mode="add"
      clientId={clientId}
      initialValues={EMPTY_EVENT_VALUES}
      initialIsTask={isTaskEvent()}
      month={month}
      datesWithItems={datesWithItems}
      documents={[]}
      buckets={buckets}
      returnHref={addEventReturnHref(clientId, origin, base)}
      notAllowedMessage={`Your shift with ${patient.firstName} has ended, so this event wasn't saved.`}
    />
  );
}
