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

/** Days in the shown month that already have an occurrence (task or plain event), for "Pick a
 * date"'s dots (AC-03). */
async function datesWithItemsFor(clientId: string, month: string): Promise<string[]> {
  const occurrences = await getOccurrences(clientId, monthBounds(month), { type: "all" });
  return [...new Set(occurrences.map((occurrence) => melbourneDateKey(occurrence.start)))];
}

/**
 * Family · Add event (FAM-UI-03). The header title 'Add event' is PROPOSED (not
 * designed); the layout is Edit event's, empty, with no documents yet (FD-02).
 * The picker opens on the current Melbourne month. Save event and Cancel go back
 * to the Calendar view it was opened from (`from=calendar` plus `view / date /
 * month`, re-validated, CHG-017), else to Family Home (CHG-015).
 */
export default async function NewEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clientId } = await params;
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
      returnHref={addEventReturnHref(clientId, origin)}
    />
  );
}
