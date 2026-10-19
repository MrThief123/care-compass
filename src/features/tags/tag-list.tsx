import { cn } from "@/lib/utils";

export interface TagListProps {
  tags: readonly string[];
  className?: string;
}

/**
 * An item's tags, read-only (F0-29): small text chips in a list named "Tags". Nothing when there
 * are none. Text, not colour, carries each tag.
 */
export function TagList({ tags, className }: TagListProps) {
  if (tags.length === 0) return null;
  return (
    <ul aria-label="Tags" className={cn("flex flex-wrap gap-1", className)}>
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-control border border-border-subtle bg-bg-inset px-2 py-0.5 text-body-small text-text-primary [overflow-wrap:anywhere]"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}
