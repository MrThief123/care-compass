import { addEventReturnHref } from "@/features/family-event-form/event-form-return";
import { EventFormScreen } from "@/features/family-event-form/event-form-screen";
import { EMPTY_EVENT_VALUES, isTaskEvent } from "@/features/family-event-form/event-form-values";
import { resolveTaskDetailOrigin } from "@/features/family-task-detail/task-detail-origin";
import { melbourneDateKey } from "@/features/family-task-log/melbourne-time";
import { getToday } from "@/server/events/queries";

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
  const origin = await resolveTaskDetailOrigin(await searchParams, () => getToday());
  return (
    <EventFormScreen
      mode="add"
      initialValues={EMPTY_EVENT_VALUES}
      initialIsTask={isTaskEvent()}
      month={melbourneDateKey(new Date().toISOString())}
      documents={[]}
      returnHref={addEventReturnHref(clientId, origin)}
    />
  );
}
