import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export interface SelectableListRowProps {
  name: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * Avatar + name row; selected state is a solid bg/brand-deep tile with
 * white text and a check icon (Admin Manage, UI-03 PRD.md Scope). The
 * Avatar itself swaps to a white ground with brand-deep initials so it
 * still reads on the solid selected background (Figma Avatar doc, D20).
 */
export function SelectableListRow({ name, selected, onClick, className }: SelectableListRowProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-control px-3 py-2 text-left",
        selected ? "bg-bg-brand-deep text-text-on-dark" : "text-text-primary hover:bg-bg-inset",
        className,
      )}
    >
      <span aria-hidden="true">
        <Avatar
          name={name}
          size="sm"
          className={selected ? "bg-bg-surface text-text-brand" : undefined}
        />
      </span>
      <span className="truncate text-body-default">{name}</span>
      {selected && <Icon name="check" size={16} className="ml-auto shrink-0" aria-hidden />}
    </button>
  );
}
