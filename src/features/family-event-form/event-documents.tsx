"use client";

import { useRef, useState } from "react";

import { uploadDocument } from "@/server/documents/actions";
import type { EventDocument } from "@/types/domain";

import { AddFileTile } from "./add-file-tile";
import { OpenDocumentTile } from "./open-document-tile";

const ADD_FILE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.heic,.heif,.docx";
const NO_EVENT_YET_MESSAGE = "Save the event first, then open it again to add files.";

export interface EventDocumentsProps {
  clientId: string;
  /** Absent on Add event (FD-02): a document cannot be linked to an event that does not
   * exist yet, so the Add file tile explains that instead of opening the picker. */
  eventId?: string;
  documents: EventDocument[];
}

/**
 * The Documents section of the Edit/Add event form (FAM-08): existing tiles, each opening its
 * signed URL on click (AC-03), then '+ Add file'. A chosen file goes to `uploadDocument` with
 * the client and event ids; its tile appears at once (AC-01). A refusal (type, size) shows its
 * message and adds no tile (AC-02). Mirrors `DocumentationCard`'s interaction (FAM-09).
 */
export function EventDocuments({ clientId, eventId, documents }: EventDocumentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [added, setAdded] = useState<EventDocument[]>([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const known = new Set(documents.map((document) => document.id));
  const shown = [...documents, ...added.filter((document) => !known.has(document.id))];

  async function onChosen(file: File | undefined) {
    if (!file || !eventId) return;
    setMessage("");
    setUploading(true);
    try {
      const form = new FormData();
      form.set("clientId", clientId);
      form.set("eventId", eventId);
      form.set("file", file);
      const result = await uploadDocument(form);
      if (!result.ok) {
        setMessage(result.error.message);
        return;
      }
      setAdded((current) => [
        ...current,
        {
          id: result.data.documentId,
          clientId,
          eventId,
          name: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          uploadedAt: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessage("Couldn't upload that file. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div role="region" aria-label="Documents" className="flex flex-col gap-2">
      <ul className="grid grid-cols-[repeat(auto-fill,6.5rem)] gap-3">
        {shown.map((document) => (
          <li key={document.id} className="min-w-0">
            <OpenDocumentTile document={document} showDetails={false} onOpenError={setMessage} />
          </li>
        ))}
        <li className="min-w-0">
          <AddFileTile
            onAdd={() => {
              if (!eventId) {
                setMessage(NO_EVENT_YET_MESSAGE);
                return;
              }
              if (!uploading) inputRef.current?.click();
            }}
          />
          <input
            ref={inputRef}
            type="file"
            hidden
            aria-label="Choose a file to add"
            accept={ADD_FILE_ACCEPT}
            onChange={(event) => void onChosen(event.target.files?.[0])}
          />
        </li>
      </ul>
      <p role="status" className="text-body-small text-text-secondary empty:hidden">
        {message}
      </p>
    </div>
  );
}
