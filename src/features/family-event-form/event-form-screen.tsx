"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EventForm, type EventFormValues } from "@/components/shared/forms";
import { DocumentTile } from "@/features/family-task-detail/document-tile";
import type { BudgetBucketSummary, EventDocument } from "@/types/domain";

import { AddFileTile } from "./add-file-tile";
import {
  EMPTY_EVENT_COST,
  hasCostText,
  validateEventCost,
  type EventCostValues,
} from "./event-cost";
import { EventCostFields } from "./event-cost-fields";
import { TaskSwitch } from "./task-switch";

export interface EventFormScreenProps {
  mode: "add" | "edit";
  initialValues: EventFormValues;
  /** The task switch's starting value (CHG-009): on for a new event. */
  initialIsTask: boolean;
  /** Any date in the month the picker opens on. */
  month: string;
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
 * Family · Add event and Edit event (FAM-UI-03). Phase 1: every change is
 * local state and is gone on reload. Save event validates (EventForm, then the
 * Cost and Paid from fields, FAM-UI-08) and then goes to `returnHref` without saving; Cancel goes there without changes
 * (FD-04, CHG-015). Persisting is FAM-06 / FAM-07.
 */
export function EventFormScreen({
  mode,
  initialValues,
  initialIsTask,
  month,
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
  const [uploadNotice, setUploadNotice] = useState(false);
  const hasSavedCost = hasCostText(initialCost);

  function changeCost(next: EventCostValues) {
    setCost(next);
    setCostErrors({});
  }

  // EventForm has already checked its own fields; the cost is checked here (FD-02).
  function save() {
    const errors = validateEventCost(cost, buckets);
    setCostErrors(errors);
    if (Object.keys(errors).length === 0) router.push(returnHref);
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
        className="lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10"
        extraFields={
          <>
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
    </div>
  );
}
