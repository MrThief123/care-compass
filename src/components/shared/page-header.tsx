import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";

import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** Left side: client identity (Family, D16) or screen title (Carer/Admin). */
  subject: ReactNode;
  /** Current date, formatted via `formatLongDate` (e.g. "Monday 30 November 2026"). */
  date: string;
  userFirstName: string;
  /** Carer only (PRD.md F0-15 Scope: "Bell renders only in the Carer header"). */
  bell?: boolean;
}

/**
 * 76px chrome bar beside the rail (F0-15 PRD.md Scope). 76px is the minimum:
 * when the window is too narrow for everything on one row, the date and user
 * drop to a second row and the bar grows to hold them, so nothing spills out of
 * the bar or overlaps. `subject` must let its own text shrink (`min-w-0` plus
 * `truncate` or `line-clamp-*`).
 */
export function PageHeader({ subject, date, userFirstName, bell = false }: PageHeaderProps) {
  return (
    <header className="flex min-h-[76px] shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border-default bg-bg-surface px-6 py-1.5">
      <div className="flex min-w-0 flex-[1_1_14rem] items-center gap-3">{subject}</div>
      <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-x-4 gap-y-1">
        <p className="text-body-default tabular-nums text-text-secondary">{date}</p>
        <div aria-hidden="true" className="h-6 w-px bg-border-default max-md:hidden" />
        {bell && (
          <button type="button" aria-label="Notifications" className="text-text-secondary">
            <Icon name="bell" size={20} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <Avatar name={userFirstName} size="md" />
          <p className="text-body-default text-text-primary">{userFirstName}</p>
        </div>
      </div>
    </header>
  );
}
