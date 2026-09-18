import { cn } from "@/lib/utils";
import type { CarerNotificationSource } from "@/types/domain";

export interface NotificationRowProps {
  source: CarerNotificationSource;
  message: string;
  className?: string;
}

const SOURCE_LABEL: Record<CarerNotificationSource, string> = {
  admin: "Admin",
  family: "Family",
};

/** Source chip (Admin neutral / Family brand) + message (UI-03 PRD.md Scope). */
export function NotificationRow({ source, message, className }: NotificationRowProps) {
  return (
    <div className={cn("flex items-start gap-2 border-b border-border-subtle py-2", className)}>
      <span
        className={cn(
          "shrink-0 rounded-pill px-2 py-1 text-body-secondary",
          source === "family"
            ? "bg-bg-brand-pale text-text-brand"
            : "bg-bg-inset text-text-secondary",
        )}
      >
        {SOURCE_LABEL[source]}
      </span>
      <p className="text-body-default text-text-primary">{message}</p>
    </div>
  );
}
