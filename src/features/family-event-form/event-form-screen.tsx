"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EventForm, type EventFormValues } from "@/components/shared/forms";
import { DocumentTile } from "@/features/family-task-detail/document-tile";
import type { EventDocument } from "@/types/domain";

import { AddFileTile } from "./add-file-tile";

export interface EventFormScreenProps {
  mode: "add" | "edit";
  initialValues: EventFormValues;
  /** Any date in the month the picker opens on. */
  month: string;
  documents: EventDocument[];
}

const TITLES = { add: "Add event", edit: "Edit event" } as const;

/**
 * Family · Add event and Edit event (FAM-UI-03). Phase 1: every change is
 * local state and is gone on reload. Save event validates (EventForm) and then
 * returns to the previous screen without saving; Cancel returns without
 * changes (FD-04). Persisting is FAM-06 / FAM-07.
 */
export function EventFormScreen({ mode, initialValues, month, documents }: EventFormScreenProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [uploadNotice, setUploadNotice] = useState(false);

  return (
    <div className="flex flex-col gap-5 px-6 pb-6 pt-5">
      <h1 className="text-title-page text-text-primary">{TITLES[mode]}</h1>
      {/* The kit's EventForm titles its cards with h3; this keeps the outline h1 > h2 > h3 (FD-06). */}
      <h2 className="sr-only">Event details</h2>
      <EventForm
        values={values}
        onChange={setValues}
        onSubmit={() => router.back()}
        onCancel={() => router.back()}
        month={month}
        className="lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10"
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
