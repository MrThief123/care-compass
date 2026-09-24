import { addEventReturnHref } from "@/features/family-event-form/event-form-return";
import { EventFormScreen } from "@/features/family-event-form/event-form-screen";
import { EMPTY_EVENT_VALUES, isTaskEvent } from "@/features/family-event-form/event-form-values";
import { melbourneDateKey } from "@/features/family-task-log/melbourne-time";

/**
 * Family · Add event (FAM-UI-03). The header title 'Add event' is PROPOSED (not
 * designed); the layout is Edit event's, empty, with no documents yet (FD-02).
 * The picker opens on the current Melbourne month. Save event and Cancel go to
 * Family Home, its only opener (CHG-015).
 */
export default async function NewEventPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  return (
    <EventFormScreen
      mode="add"
      initialValues={EMPTY_EVENT_VALUES}
      initialIsTask={isTaskEvent()}
      month={melbourneDateKey(new Date().toISOString())}
      documents={[]}
      returnHref={addEventReturnHref(clientId)}
    />
  );
}
