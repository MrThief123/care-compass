import Link from "next/link";

import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { CountBadge } from "@/components/ui/count-badge";
import { Icon } from "@/components/ui/icon";
import type { Occurrence } from "@/types/domain";

import { ActivityLinkRow } from "./activity-link-row";
import { shortDate } from "./home-format";
import { homeRoutes } from "./home-routes";

export interface OverdueCardProps {
  clientId: string;
  /** The overdue occurrences the card lists, oldest first. May be fewer than `total`. */
  occurrences: Occurrence[];
  /** How many are overdue in all, from the contract, which the badge and "View all" show. */
  total: number;
}

/**
 * Overdue card: the count, up to a handful of rows, and, whenever there are more
 * overdue than rows, a link to all of them, so nothing overdue is ever out of
 * reach. A calm "All caught up" when nothing is overdue.
 */
export function OverdueCard({ clientId, occurrences, total }: OverdueCardProps) {
  if (total === 0 && occurrences.length === 0) {
    return (
      <section aria-label="Overdue">
        <CardShell className="flex flex-col gap-2">
          <p className="text-title-card text-text-primary">Overdue</p>
          <EmptyState title="All caught up" body="Nothing is overdue right now." />
        </CardShell>
      </section>
    );
  }

  return (
    <section aria-label="Overdue">
      <CardShell tone="alert" className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="alert-triangle" size={16} className="text-text-alert-strong" aria-hidden />
            <p className="text-title-card text-text-alert-strong">Overdue</p>
          </div>
          <CountBadge count={total} tone="alert" />
        </div>
        <ul>
          {occurrences.map((occurrence) => (
            <li key={occurrence.key}>
              <ActivityLinkRow
                href={homeRoutes.taskDetail(clientId, occurrence.key)}
                title={occurrence.title}
                date={shortDate(occurrence.start)}
                status="overdue"
              />
            </li>
          ))}
        </ul>
        {total > occurrences.length && (
          <Link
            href={homeRoutes.overdueTasks(clientId)}
            className="inline-flex min-h-11 items-center self-start rounded-control text-body-emphasis text-text-alert-strong outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {`View all ${total} overdue`}
          </Link>
        )}
      </CardShell>
    </section>
  );
}
