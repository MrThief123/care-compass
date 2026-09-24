"use client";

import { useId, useState } from "react";

import { CardShell } from "@/components/ui/card-shell";
import { AddFileTile } from "@/features/family-event-form/add-file-tile";
import { DocumentTile } from "@/features/family-task-detail/document-tile";
import { cn } from "@/lib/utils";
import type { DocumentRef } from "@/types/domain";

export interface DocumentationCardProps {
  documents: DocumentRef[];
  /** Absent, not disabled, when false (CLAUDE.md §7): the 'Add file' tile goes with it. */
  canEdit: boolean;
}

/**
 * The client's documents as name-only tiles, then 'Add file'. The tiles wrap
 * onto further rows rather than overflow. Uploads are Phase 3 (FAM-08), so
 * 'Add file' only says so, in a live region that is always on the page so the
 * message is announced when it appears.
 */
export function DocumentationCard({ documents, canEdit }: DocumentationCardProps) {
  const headingId = useId();
  const [uploadNotice, setUploadNotice] = useState(false);

  return (
    <CardShell role="region" aria-labelledby={headingId} className="flex flex-col">
      <h2 id={headingId} className="text-title-card text-text-primary [overflow-wrap:anywhere]">
        Documentation
      </h2>
      <ul className="mt-3 flex flex-wrap gap-3">
        {documents.map((document) => (
          <li key={document.id} className="w-26 min-w-0">
            <DocumentTile document={document} showDetails={false} />
          </li>
        ))}
        {canEdit && (
          <li className="w-26 min-w-0">
            <AddFileTile onAdd={() => setUploadNotice(true)} />
          </li>
        )}
      </ul>
      <p
        role="status"
        className={cn("text-body-small text-text-secondary", uploadNotice && "mt-3")}
      >
        {uploadNotice ? "Adding files is not available yet." : ""}
      </p>
    </CardShell>
  );
}
