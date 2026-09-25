import { Icon } from "@/components/ui/icon";

/**
 * The dashed 'Add file' tile drawn on Edit event, the same size as a document
 * tile. The shared `FileTile` add variant is a one-line chip, so this local
 * tile matches the design (FD-03). Uploads are Phase 3 (F0-13, FAM-08), so
 * pressing it only asks the screen to say that.
 */
export function AddFileTile({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex min-h-26 w-full flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed border-border-brand bg-transparent p-2 text-body-small text-text-brand transition-colors hover:bg-bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Icon name="plus" size={20} aria-hidden />
      Add file
    </button>
  );
}
