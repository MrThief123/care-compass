"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EventForm, type EventFormValues } from "@/components/shared/forms";
import type { LocalDate } from "@/lib/dates/week-range";
import { createEvent, updateEvent } from "@/server/events/actions";
import type { BudgetBucketSummary, EventDocument } from "@/types/domain";

import { EditScopeFields } from "./edit-scope-fields";
import {
  EMPTY_EVENT_COST,
  hasCostText,
  validateEventCost,
  type EventCostValues,
} from "./event-cost";
import { EventCostFields } from "./event-cost-fields";
import {
  EMPTY_EVENT_DETAILS,
  parseEventDetails,
  validateEventDetails,
  type EventDetailsValues,
} from "./event-details";
import { EventDetailsFields } from "./event-details-fields";
import { EventDocuments } from "./event-documents";
import { TaskSwitch } from "./task-switch";

import type { EditScope } from "./edit-scope";

export interface EventFormScreenProps {
  mode: "add" | "edit";
  /** The client the event belongs to (FAM-06: who `createEvent` saves it for). */
  clientId: string;
  /** The event being edited; absent on Add event. */
  eventId?: string;
  /** The viewed occurrence's original start (its identity, PD-004) — Edit event only. */
  occurrenceOriginalStart?: string;
  initialValues: EventFormValues;
  /** The task switch's starting value (CHG-009): on for a new event. */
  initialIsTask: boolean;
  /** Any date in the month the picker opens on. */
  month: string;
  /** Days in `month` that already have events, for "Pick a date"'s dots (AC-03). */
  datesWithItems?: LocalDate[];
  documents: EventDocument[];
  /** The client's buckets, for Paid from (FAM-UI-08). */
  buckets: BudgetBucketSummary[];
  /** The event's saved cost and bucket on Edit event; none on Add event. */
  initialCost?: EventCostValues;
  /** Title, Start time and Duration (PD-047): the event's own, on Edit; empty on Add. */
  initialDetails?: EventDetailsValues;
  /** Where Save event and Cancel go (CHG-015, `event-form-return.ts`); already validated. */
  returnHref: string;
}

const TITLES = { add: "Add event", edit: "Edit event" } as const;

/**
 * Family · Add event and Edit event (FAM-UI-03, FAM-06, FAM-07). Add event persists through
 * `createEvent`; Edit event through `updateEvent`. Save event validates (EventForm, then
 * Cost/Paid from and Title/Start time/Duration) and only then saves; Cancel goes to
 * `returnHref` without changes (FD-04, CHG-015).
 */
export function EventFormScreen({
  mode,
  clientId,
  eventId,
  occurrenceOriginalStart,
  initialValues,
  initialIsTask,
  month,
  datesWithItems,
  documents,
  buckets,
  initialCost = EMPTY_EVENT_COST,
  initialDetails = EMPTY_EVENT_DETAILS,
  returnHref,
}: EventFormScreenProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [isTask, setIsTask] = useState(initialIsTask);
  const [cost, setCost] = useState(initialCost);
  const [costErrors, setCostErrors] = useState<Record<string, string>>({});
  const [details, setDetails] = useState(initialDetails);
  const [detailsErrors, setDetailsErrors] = useState<Record<string, string>>({});
  const [scope, setScope] = useState<EditScope>("occurrence");
  const [saveError, setSaveError] = useState<string>();
  const hasSavedCost = hasCostText(initialCost);

  function changeCost(next: EventCostValues) {
    setCost(next);
    setCostErrors({});
  }

  function changeDetails(next: typeof details) {
    setDetails(next);
    setDetailsErrors({});
  }

  // EventForm has already checked its own fields (Date); Cost (FD-02) and Title/Start
  // time/Duration are checked here, then the event is created or updated before navigating away.
  async function save() {
    const nextCostErrors = validateEventCost(cost, buckets);
    const nextDetailsErrors = validateEventDetails(details);
    setCostErrors(nextCostErrors);
    setDetailsErrors(nextDetailsErrors);
    if (Object.keys(nextCostErrors).length > 0 || Object.keys(nextDetailsErrors).length > 0) {
      return;
    }
    const parsedDetails = parseEventDetails(details)!;
    setSaveError(undefined);

    if (mode === "edit") {
      const result = await updateEvent({
        clientId,
        eventId: eventId!,
        occurrenceOriginalStart: occurrenceOriginalStart!,
        title: parsedDetails.title,
        description: values.description,
        date: values.date,
        startTime: parsedDetails.startTime,
        durationMinutes: parsedDetails.durationMinutes,
        recurrence: values.recurrence,
        isTask,
        scope,
      });
      if (!result.ok) {
        setSaveError(result.error.message);
        return;
      }
      router.push(returnHref);
      return;
    }

    const result = await createEvent({
      clientId,
      title: parsedDetails.title,
      description: values.description,
      date: values.date,
      startTime: parsedDetails.startTime,
      durationMinutes: parsedDetails.durationMinutes,
      recurrence: values.recurrence,
      isTask,
    });
    if (!result.ok) {
      setSaveError(result.error.message);
      return;
    }
    router.push(returnHref);
  }

  return (
    <div className="flex flex-col gap-5 px-6 pb-6 pt-5">
      <h1 className="text-title-page text-text-primary">{TITLES[mode]}</h1>
      {/* The kit's EventForm titles its cards with h3; this keeps the outline h1 > h2 > h3 (FD-06). */}
      <h2 className="sr-only">Event details</h2>
      <EventForm
        values={values}
        onChange={setValues}
        onSubmit={save}
        onCancel={() => router.push(returnHref)}
        month={month}
        datesWithItems={datesWithItems}
        className="lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10"
        extraFields={
          <>
            {/* Title, Start time and Duration (OQ-22/PD-047). */}
            <EventDetailsFields values={details} onChange={changeDetails} errors={detailsErrors} />
            {/* PD-045: only meaningful for a recurring event — a one-off's one occurrence is
                its whole series, so there is nothing to choose between. */}
            {mode === "edit" && values.recurrence !== "none" && (
              <EditScopeFields value={scope} onChange={setScope} />
            )}
            <TaskSwitch checked={isTask} onChange={setIsTask} />
            <EventCostFields
              values={cost}
              onChange={changeCost}
              buckets={buckets}
              recurrence={values.recurrence}
              errors={costErrors}
              hasSavedCost={hasSavedCost}
            />
          </>
        }
        documents={<EventDocuments clientId={clientId} eventId={eventId} documents={documents} />}
      />
      <p
        role="status"
        aria-label="Save error"
        className="text-body-small text-text-alert-strong empty:hidden"
      >
        {saveError}
      </p>
    </div>
  );
}
