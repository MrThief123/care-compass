import { Icon } from "@/components/ui/icon";

/**
 * Read-only document tile as drawn on Task detail and Edit event: a
 * bordered square with the file icon above a centred, wrapping name. The
 * shared `FileTile` is a horizontal chip, so this local tile matches the
 * design instead (DECISIONS.md FD-09). Not interactive: opening a document
 * is Phase 3 (F0-13, signed URLs).
 */
export function DocumentTile({ name }: { name: string }) {
  return (
    <div className="flex min-h-26 w-26 flex-col items-center justify-center gap-2 rounded-card border border-bg-muted bg-bg-surface p-2 text-center text-body-small text-text-primary">
      <Icon name="file" size={20} aria-hidden />
      <span className="max-w-full break-words">{name}</span>
    </div>
  );
}
