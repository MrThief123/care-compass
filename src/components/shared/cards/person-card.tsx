import { Avatar } from "@/components/ui/avatar";
import { CardShell } from "@/components/ui/card-shell";
import { cn } from "@/lib/utils";

export interface PersonCardProps {
  name: string;
  /** e.g. "78 years · Preston VIC". */
  meta: string;
  onClick?: () => void;
  className?: string;
}

/** Avatar initial, name, meta line — Patients grid (UI-03 PRD.md Scope). */
export function PersonCard({ name, meta, onClick, className }: PersonCardProps) {
  const content = (
    <>
      <Avatar name={name} size="lg" />
      <div className="flex flex-col items-center text-center">
        <p className="text-title-card text-text-primary">{name}</p>
        <p className="text-body-small text-text-secondary">{meta}</p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex flex-col items-center gap-2 rounded-card border border-border-default bg-bg-surface p-4 hover:bg-bg-inset",
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <CardShell className={cn("flex flex-col items-center gap-2", className)}>{content}</CardShell>
  );
}
