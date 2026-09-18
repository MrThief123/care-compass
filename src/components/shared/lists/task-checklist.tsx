import { Checkbox } from "@/components/ui/checkbox";

export interface TaskChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface TaskChecklistProps {
  items: TaskChecklistItem[];
  onToggle: (id: string, checked: boolean) => void;
  className?: string;
}

/** Checkbox rows; checked items render struck-through and muted (UI-03 PRD.md Scope, via Checkbox). */
export function TaskChecklist({ items, onToggle, className }: TaskChecklistProps) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.id}>
          <Checkbox
            label={item.label}
            checked={item.checked}
            onChange={(checked) => onToggle(item.id, checked)}
          />
        </li>
      ))}
    </ul>
  );
}
