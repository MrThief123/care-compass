import { cn } from "@/lib/utils";

import { Icon } from "../ui/icon";

export type FileTileProps =
  | { variant: "filled"; fileName: string; onClick?: () => void; className?: string }
  | { variant: "add"; onAdd: () => void; className?: string };

const BASE = "flex h-11 items-center gap-2 rounded-control border px-3 text-body-default";

export function FileTile(props: FileTileProps) {
  if (props.variant === "add") {
    return (
      <button
        type="button"
        onClick={props.onAdd}
        className={cn(
          BASE,
          "border-dashed border-border-default text-text-secondary hover:bg-bg-inset",
          props.className,
        )}
      >
        + Add file
      </button>
    );
  }

  const content = (
    <>
      <Icon name="file" size={16} className="shrink-0 text-text-secondary" />
      <span className="truncate">{props.fileName}</span>
    </>
  );

  if (props.onClick) {
    return (
      <button
        type="button"
        onClick={props.onClick}
        className={cn(
          BASE,
          "border-border-default text-text-primary hover:bg-bg-inset",
          props.className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn(BASE, "border-border-default text-text-primary", props.className)}>
      {content}
    </div>
  );
}
