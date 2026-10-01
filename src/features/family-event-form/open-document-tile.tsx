"use client";

import { useState } from "react";

import {
  DocumentTile,
  type DocumentTileDocument,
} from "@/features/family-task-detail/document-tile";
import { getDocumentUrl } from "@/server/documents/actions";

/**
 * A `DocumentTile` that opens its document's signed URL in a new tab on click (FAM-08 AC-03).
 * The tab is opened before the await, so the browser treats it as the click's own tab (no
 * popup block, the same pattern `DocumentationCard` uses, FAM-09). A failure (expired link,
 * network error, or a browser that blocked the pop-up) is shown under the tile it belongs to,
 * unless `onOpenError` is given — then it is reported there instead, so a caller with several
 * tiles (`EventDocuments`, which already has hooks) can show one shared status line. Leaving it
 * out keeps the caller (`TaskDetailView`) a hookless server component.
 */
export function OpenDocumentTile({
  document,
  showDetails = true,
  onOpenError,
}: {
  document: DocumentTileDocument & { id: string };
  showDetails?: boolean;
  onOpenError?: (message: string) => void;
}) {
  const [localError, setLocalError] = useState("");
  const reportError = onOpenError ?? setLocalError;

  async function open() {
    reportError("");
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    try {
      const result = await getDocumentUrl(document.id);
      if (result.ok && tab) {
        tab.location.href = result.data.url;
        return;
      }
      tab?.close();
      reportError(result.ok ? "Allow pop-ups to open documents." : result.error.message);
    } catch {
      tab?.close();
      reportError("Couldn't open that document.");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        aria-label={document.name}
        onClick={() => void open()}
        className="block w-full min-w-0 cursor-pointer rounded-card focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <DocumentTile document={document} showDetails={showDetails} />
      </button>
      {!onOpenError && (
        <p role="status" className="text-body-small text-text-alert-strong empty:hidden">
          {localError}
        </p>
      )}
    </div>
  );
}
