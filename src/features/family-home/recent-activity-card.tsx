import Link from "next/link";

import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import type { Occurrence } from "@/types/domain";

import { ActivityLinkRow } from "./activity-link-row";
import { shortDate } from "./home-format";
import { homeRoutes } from "./home-routes";

export interface RecentActivityCardProps {
  clientId: string;
  /** Latest first. */
  occurrences: Occurrence[];
}

/** Recent activity: the latest done and overdue occurrences, each opening its task detail. */
export function RecentActivityCard({ clientId, occurrences }: RecentActivityCardProps) {
  return (
    <section aria-labelledby="family-home-recent-activity">
      <CardShell className="flex flex-col gap-2">
        <div className="flex min-h-11 items-center justify-between">
          <h2 id="family-home-recent-activity" className="text-title-card text-text-primary">
            Recent activity
          </h2>
          <Link
            href={homeRoutes.tasks(clientId)}
            className="inline-flex min-h-11 items-center px-5 text-body-emphasis text-text-brand hover:underline"
          >
            View all
          </Link>
        </div>
        {occurrences.length === 0 ? (
          <EmptyState
            icon="clipboard-check"
            title="No recent activity"
            body="Completed and overdue events will appear here."
          />
        ) : (
          <ul>
            {occurrences.map((occurrence) => (
              <li key={occurrence.key}>
                <ActivityLinkRow
                  href={homeRoutes.taskDetail(clientId, occurrence.key)}
                  title={occurrence.title}
                  date={shortDate(occurrence.start)}
                  status={occurrence.status}
                  // REQ-19: a Done pill always names who did it.
                  actorName={occurrence.actor ?? "—"}
                />
              </li>
            ))}
          </ul>
        )}
      </CardShell>
    </section>
  );
}
