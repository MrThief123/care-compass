"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

import { CardShell } from "@/components/ui/card-shell";
import { AddFileTile } from "@/features/family-event-form/add-file-tile";
import { DocumentTile } from "@/features/family-task-detail/document-tile";
import { getDocumentUrl, uploadDocument } from "@/server/documents/actions";
import type { DocumentRef } from "@/types/domain";

const OPEN_FAILED_MESSAGE = "Couldn't open that document.";

export interface CarerDocumentationCardProps {
  clientId: string;
  documents: DocumentRef[];
  /** Absent, not disabled, when false (CLAUDE.md §7): 'Add file' goes with it. */
  canEdit: boolean;
}

/**
 * The client's documents as name-only tiles, then 'Add file' while on shift (CAR-04). A chosen
 * file goes to `uploadDocument` with the client id and no event id; its tile appears at once.
 * A refusal (type, size, shift ended) shows its message and adds no tile. There is no way to
 * remove a file (FD-05). A saved document's tile opens its signed URL in a new tab, on or off
 * shift (FD-10); a tile added in this session has no open action.
 */
export function CarerDocumentationCard({
  clientId,
  documents,
  canEdit,
}: CarerDocumentationCardProps) {
  const router = useRouter();
  const headingId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [added, setAdded] = useState<DocumentRef[]>([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  // A refresh brings the saved list: drop the locally added tiles the server now returns.
  const known = new Set(documents.map((document) => document.id));
  const addedIds = new Set(
    added.filter((document) => !known.has(document.id)).map((document) => document.id),
  );
  const shown = [...documents, ...added.filter((document) => !known.has(document.id))];

  async function openDocument(documentId: string) {
    setError("");
    // Opened before the await so the browser treats it as the click's own tab (no popup block).
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    try {
      const result = await getDocumentUrl(documentId);
      if (result.ok && tab) {
        tab.location.href = result.data.url;
        return;
      }
      tab?.close();
      if (!result.ok) setError(result.error.message);
      else setError("Allow pop-ups to open documents.");
    } catch {
      tab?.close();
      setError(OPEN_FAILED_MESSAGE);
    }
  }

  async function onChosen(file: File | undefined) {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.set("clientId", clientId);
      form.set("file", file);
      const result = await uploadDocument(form);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setAdded((current) => [
        ...current,
        {
          id: result.data.documentId,
          clientId,
          name: file.name,
          url: "",
          uploadedAt: new Date().toISOString(),
        },
      ]);
      router.refresh();
    } catch {
      setError("Couldn't upload that file. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <CardShell role="region" aria-labelledby={headingId} className="flex flex-col p-3.75">
      <h2 id={headingId} className="text-title-card text-text-primary [overflow-wrap:anywhere]">
        Documentation
      </h2>
      <ul className="mt-2.5 flex flex-wrap gap-3">
        {shown.map((document) => (
          <li key={document.id} className="w-26 min-w-0">
            {addedIds.has(document.id) ? (
              <DocumentTile document={document} showDetails={false} />
            ) : (
              <button
                type="button"
                aria-label={document.name}
                onClick={() => void openDocument(document.id)}
                className="block w-full min-w-0 cursor-pointer rounded-card focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <DocumentTile document={document} showDetails={false} />
              </button>
            )}
          </li>
        ))}
        {canEdit && (
          <li className="w-26 min-w-0">
            <AddFileTile onAdd={() => !uploading && inputRef.current?.click()} />
            <input
              ref={inputRef}
              type="file"
              hidden
              aria-label="Choose a file to add"
              accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.docx"
              onChange={(event) => void onChosen(event.target.files?.[0])}
            />
          </li>
        )}
      </ul>
      <p
        role="status"
        className={error ? "mt-2.5 text-body-small text-text-error" : "text-body-small"}
      >
        {error}
      </p>
    </CardShell>
  );
}
