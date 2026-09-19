"use client";

import { useRouter } from "next/navigation";

import { AlertListCard } from "@/components/shared/lists/alert-list-card";
import { EmptyState } from "@/components/shared/states";
import { CardShell } from "@/components/ui/card-shell";
import { formatShortDate } from "@/lib/format/date";
import type { Occurrence } from "@/types/domain";

import { homeRoutes } from "./home-routes";

export interface OverdueCardProps {
  clientId: string;
  /** Overdue occurrences, oldest first. */
  occurrences: Occurrence[];
  /** How many are overdue in all, which the badge shows. */
  total: number;
}

/** Overdue card: the shared alert card, or a calm "All caught up" when nothing is overdue. */
export function OverdueCard({ clientId, occurrences, total }: OverdueCardProps) {
  const router = useRouter();

  return (
    <section aria-label="Overdue">
      {occurrences.length === 0 ? (
        <CardShell className="flex flex-col gap-2">
          <p className="text-title-card text-text-primary">Overdue</p>
          <EmptyState title="All caught up" body="Nothing is overdue right now." />
        </CardShell>
      ) : (
        <AlertListCard
          title="Overdue"
          count={total}
          rows={occurrences.map((occurrence) => ({
            key: occurrence.key,
            title: occurrence.title,
            date: formatShortDate(occurrence.start),
            onClick: () => router.push(homeRoutes.taskDetail(clientId, occurrence.key)),
          }))}
        />
      )}
    </section>
  );
}
