import { Icon } from "@/components/ui/icon";
import type { EventDocument } from "@/types/domain";

import { fileTypeLabel, formatFileSize } from "./document-format";

/**
 * Read-only document tile as drawn on Task detail and Edit event: a
 * bordered square with the file icon above a centred, wrapping name (cut to
 * two lines; the whole name is in its `title`), then its type and size. The
 * shared `FileTile` is a horizontal chip, so this local tile matches the
 * design instead (DECISIONS.md FD-09). Not interactive: the contract returns
 * metadata only, and opening a document is Phase 3 (F0-13, signed URLs).
 */
export function DocumentTile({ document }: { document: EventDocument }) {
  return (
    <div className="flex min-h-26 w-26 flex-col items-center justify-center gap-1 rounded-card border border-bg-muted bg-bg-surface p-2 text-center text-body-small text-text-primary">
      <Icon name="file" size={20} aria-hidden />
      <span title={document.name} className="line-clamp-2 max-w-full break-all">
        {document.name}
      </span>
      <span className="text-text-secondary">
        {`${fileTypeLabel(document.mimeType)} · ${formatFileSize(document.sizeBytes)}`}
      </span>
    </div>
  );
}
