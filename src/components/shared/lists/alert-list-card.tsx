import { CardShell } from "@/components/ui/card-shell";
import { CountBadge } from "@/components/ui/count-badge";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

import { ActivityRow } from "./activity-row";

export interface AlertListCardRow {
  key: string;
  title: string;
  /** Short date, e.g. "Fri 27 Nov". */
  date: string;
  onClick?: () => void;
}

export interface AlertListCardProps {
  title: string;
  count: number;
  rows: AlertListCardRow[];
  /** Optional caption, e.g. "across all clients" (Admin's cross-client Overdue card). */
  caption?: string;
  className?: string;
}

/** Alert-tone card with a warning-icon title, count badge and overdue rows (UI-03 PRD.md Scope). */
export function AlertListCard({ title, count, rows, caption, className }: AlertListCardProps) {
  return (
    <CardShell tone="alert" className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="alert-triangle" size={16} className="text-text-alert-strong" aria-hidden />
          <p className="text-title-card text-text-alert-strong">{title}</p>
        </div>
        <CountBadge count={count} tone="alert" />
      </div>
      {caption && <p className="text-body-secondary text-text-secondary">{caption}</p>}
      <ul>
        {rows.map((row) => (
          <li key={row.key}>
            <ActivityRow title={row.title} date={row.date} status="overdue" onClick={row.onClick} />
          </li>
        ))}
      </ul>
    </CardShell>
  );
}
