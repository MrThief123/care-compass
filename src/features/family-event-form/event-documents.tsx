"use client";

import { useRef, useState } from "react";

import { uploadDocument } from "@/server/documents/actions";
import type { EventDocument } from "@/types/domain";

import { AddFileTile } from "./add-file-tile";
import { OpenDocumentTile } from "./open-document-tile";

const ADD_FILE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.heic,.heif,.docx";

export interface EventDocumentsProps {
  clientId: string;
  /** Absent on Add event: a file is uploaded with no event and linked on save (F0-23). */
  eventId?: string;
  documents: EventDocument[];
  /** Called with each file that uploaded, so Add event can link it once the event exists. */
  onUploaded?: (document: { id: string; name: string }) => void;
}

/**
 * The Documents section of the Edit/Add event form (FAM-08): existing tiles, each opening its
 * signed URL on click (AC-03), then '+ Add file'. A chosen file goes to `uploadDocument` with
 * the client and event ids; its tile appears at once (AC-01). A refusal (type, size) shows its
 * message and adds no tile (AC-02). On Add event (F0-23) there is no event id yet: the file uploads without one and `onUploaded` lets the screen link it after `createEvent`. Mirrors `DocumentationCard`'s interaction (FAM-09).
 */
export function EventDocuments({ clientId, eventId, documents, onUploaded }: EventDocumentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [added, setAdded] = useState<EventDocument[]>([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const known = new Set(documents.map((document) => document.id));
  const shown = [...documents, ...added.filter((document) => !known.has(document.id))];

  async function onChosen(file: File | undefined) {
    if (!file) return;
    setMessage("");
    setUploading(true);
    try {
      const form = new FormData();
      form.set("clientId", clientId);
      if (eventId) form.set("eventId", eventId);
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
          eventId: eventId ?? "",
          name: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          uploadedAt: new Date().toISOString(),
        },
      ]);
      onUploaded?.({ id: result.data.documentId, name: file.name });
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
