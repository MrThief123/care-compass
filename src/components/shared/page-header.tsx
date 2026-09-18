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

/** 76px chrome bar beside the rail (F0-15 PRD.md Scope). */
export function PageHeader({ subject, date, userFirstName, bell = false }: PageHeaderProps) {
  return (
    <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-border-default bg-bg-surface px-6">
      <div className="flex items-center gap-3">{subject}</div>
      <div className="flex items-center gap-4">
        <p className="text-body-default tabular-nums text-text-secondary">{date}</p>
        <div aria-hidden="true" className="h-6 w-px bg-border-default" />
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
