"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EventForm, type EventFormValues } from "@/components/shared/forms";
import { DocumentTile } from "@/features/family-task-detail/document-tile";
import type { LocalDate } from "@/lib/dates/week-range";
import { createEvent } from "@/server/events/actions";
import type { BudgetBucketSummary, EventDocument } from "@/types/domain";

import { AddFileTile } from "./add-file-tile";
import {
  EMPTY_EVENT_COST,
  hasCostText,
  validateEventCost,
  type EventCostValues,
} from "./event-cost";
import { EventCostFields } from "./event-cost-fields";
import { EMPTY_EVENT_DETAILS, parseEventDetails, validateEventDetails } from "./event-details";
import { EventDetailsFields } from "./event-details-fields";
import { TaskSwitch } from "./task-switch";

export interface EventFormScreenProps {
  mode: "add" | "edit";
  /** The client the event belongs to (FAM-06: who `createEvent` saves it for). */
  clientId: string;
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
  /** Where Save event and Cancel go (CHG-015, `event-form-return.ts`); already validated. */
  returnHref: string;
}

const TITLES = { add: "Add event", edit: "Edit event" } as const;

/**
 * Family · Add event and Edit event (FAM-UI-03, FAM-06). Add event persists through
 * `createEvent` (FAM-06); Edit event is still Phase 1 (every change is local state, gone on
 * reload) — persisting an edit is FAM-07. Save event validates (EventForm, then Cost/Paid
 * from and, on Add, Title/Start time/Duration) and only then saves; Cancel goes to
 * `returnHref` without changes (FD-04, CHG-015).
 */
export function EventFormScreen({
  mode,
  clientId,
  initialValues,
  initialIsTask,
  month,
  datesWithItems,
  documents,
  buckets,
  initialCost = EMPTY_EVENT_COST,
  returnHref,
}: EventFormScreenProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [isTask, setIsTask] = useState(initialIsTask);
  const [cost, setCost] = useState(initialCost);
  const [costErrors, setCostErrors] = useState<Record<string, string>>({});
  const [details, setDetails] = useState(EMPTY_EVENT_DETAILS);
  const [detailsErrors, setDetailsErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string>();
  const [uploadNotice, setUploadNotice] = useState(false);
  const hasSavedCost = hasCostText(initialCost);

  function changeCost(next: EventCostValues) {
    setCost(next);
    setCostErrors({});
  }

  function changeDetails(next: typeof details) {
    setDetails(next);
    setDetailsErrors({});
  }

  // EventForm has already checked its own fields (Date); Cost (FD-02) and, on Add, Title/Start
  // time/Duration are checked here, then the event is created (FAM-06) before navigating away.
  async function save() {
    const nextCostErrors = validateEventCost(cost, buckets);
    const nextDetailsErrors = mode === "add" ? validateEventDetails(details) : {};
    setCostErrors(nextCostErrors);
    setDetailsErrors(nextDetailsErrors);
    if (Object.keys(nextCostErrors).length > 0 || Object.keys(nextDetailsErrors).length > 0) {
      return;
    }

    if (mode === "edit") {
      // Persisting an edit is FAM-07; unchanged from Phase 1 until then.
      router.push(returnHref);
      return;
    }

    const parsedDetails = parseEventDetails(details)!;
    setSaveError(undefined);
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
            {/* Title, Start time and Duration (OQ-22/PD-047): Add event only — Edit event's
                persistence is FAM-07, so these would show blank, misleading state there. */}
            {mode === "add" && (
              <EventDetailsFields
                values={details}
                onChange={changeDetails}
                errors={detailsErrors}
              />
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
        documents={
          <div role="region" aria-label="Documents" className="flex flex-col gap-2">
            <ul className="grid grid-cols-[repeat(auto-fill,6.5rem)] gap-3">
              {documents.map((document) => (
                <li key={document.id} className="min-w-0">
                  <DocumentTile document={document} showDetails={false} />
                </li>
              ))}
              <li className="min-w-0">
                <AddFileTile onAdd={() => setUploadNotice(true)} />
              </li>
            </ul>
            <p role="status" className="text-body-small text-text-secondary">
              {uploadNotice ? "Adding files is not available yet." : ""}
            </p>
          </div>
        }
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
