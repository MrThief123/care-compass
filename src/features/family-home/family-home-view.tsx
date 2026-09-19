import { formatShortDate } from "@/lib/format/date";

import { BudgetStrip } from "./budget-strip";
import { EnterEventLink } from "./enter-event-link";
import { OverdueCard } from "./overdue-card";
import { RecentActivityCard } from "./recent-activity-card";
import { TodayPanel } from "./today-panel";

import type { FamilyHomeData } from "./home-data";

export interface FamilyHomeViewProps {
  clientId: string;
  data: FamilyHomeData;
  /** The day the Today panel is showing. */
  today: Date;
}

/**
 * Family · Home (design `family-01-home`): the Today panel beside a 340px
 * right column (Enter event, Overdue, Recent activity), and the Budget strip
 * underneath. Presentational: everything it shows comes in as props.
 */
export function FamilyHomeView({ clientId, data, today }: FamilyHomeViewProps) {
  return (
    <div className="flex flex-col gap-4 px-6 py-5">
      <div className="flex items-stretch gap-4">
        <TodayPanel occurrences={data.today} dateLabel={formatShortDate(today)} />
        <div className="flex w-[340px] shrink-0 flex-col gap-4">
          <EnterEventLink clientId={clientId} />
          <OverdueCard
            clientId={clientId}
            occurrences={data.overdue.items}
            total={data.overdue.total}
          />
          <RecentActivityCard clientId={clientId} occurrences={data.recent} />
        </div>
      </div>
      <BudgetStrip clientId={clientId} buckets={data.budget} />
    </div>
  );
}
