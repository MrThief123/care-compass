import { Icon } from "@/components/ui/icon";
import type { EventDocument } from "@/types/domain";

import { fileTypeLabel, formatFileSize } from "./document-format";

/**
 * What a tile needs: a name, and the type and size for its detail line. A
 * client document (Family · Info, FAM-UI-04) has only a name, so the other two
 * are optional and the detail line is drawn only when both are present.
 */
export type DocumentTileDocument = Pick<EventDocument, "name"> &
  Partial<Pick<EventDocument, "mimeType" | "sizeBytes">>;

/**
 * Read-only document tile as drawn on Task detail and Edit event: a
 * bordered tile with the file icon above a centred, wrapping name (cut to
 * two lines; the whole name is in its `title`), then its type and size. The
 * shared `FileTile` is a horizontal chip, so this local tile matches the
 * design instead (DECISIONS.md FD-09). Not interactive: the contract returns
 * metadata only, and opening a document is Phase 3 (F0-13, signed URLs).
 *
 * The tile takes the width of its grid cell (the Documents grid gives it at least
 * 10rem, FD-21), so a name wraps at its spaces and never mid-word. Only a name
 * with no break point at all (an unbroken run) may wrap anywhere, as a last
 * resort (`overflow-wrap:anywhere`). The type and size stay on one line and are
 * cut with an ellipsis, not wrapped or spilled, if the tile is ever too narrow.
 */
export function DocumentTile({
  document,
  showDetails = true,
}: {
  document: DocumentTileDocument;
  /** The type and size line. Edit event and Family · Info draw the name only. */
  showDetails?: boolean;
}) {
  const typeAndSize =
    showDetails && document.mimeType !== undefined && document.sizeBytes !== undefined
      ? `${fileTypeLabel(document.mimeType)} · ${formatFileSize(document.sizeBytes)}`
      : null;

  return (
    <div className="flex min-h-26 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-card border border-bg-muted bg-bg-surface p-2 text-center text-body-small text-text-primary">
      <Icon name="file" size={20} aria-hidden className="shrink-0" />
      <span title={document.name} className="line-clamp-2 max-w-full [overflow-wrap:anywhere]">
        {document.name}
      </span>
      {typeAndSize !== null && (
        <span title={typeAndSize} className="max-w-full truncate text-text-secondary">
          {typeAndSize}
        </span>
      )}
    </div>
  );
}
