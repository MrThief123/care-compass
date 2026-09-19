import { BudgetStrip } from "./budget-strip";
import { EnterEventLink } from "./enter-event-link";
import { shortDate } from "./home-format";
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
 *
 * The design is a two-column screen, which needs about 1280px. Below that the
 * columns stack (DECISIONS.md FD-18): Enter event, Today, then Overdue and
 * Recent activity side by side from 768px and one under the other below it.
 * Every grid item is `min-w-0`, so one long title or name can widen nothing.
 */
export function FamilyHomeView({ clientId, data, today }: FamilyHomeViewProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4 px-6 py-5">
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_340px] xl:grid-rows-[auto_auto_1fr]">
        <div className="min-w-0 md:col-span-2 xl:col-span-1 xl:col-start-2 xl:row-start-1">
          <EnterEventLink clientId={clientId} />
        </div>
        <div className="flex min-w-0 md:col-span-2 xl:col-span-1 xl:col-start-1 xl:row-span-3 xl:row-start-1">
          <TodayPanel clientId={clientId} occurrences={data.today} dateLabel={shortDate(today)} />
        </div>
        <div className="min-w-0 xl:col-start-2 xl:row-start-2">
          <OverdueCard
            clientId={clientId}
            occurrences={data.overdue.items}
            total={data.overdue.total}
          />
        </div>
        <div className="min-w-0 xl:col-start-2 xl:row-start-3 xl:self-start">
          <RecentActivityCard clientId={clientId} occurrences={data.recent} />
        </div>
      </div>
      <BudgetStrip clientId={clientId} buckets={data.budget} />
    </div>
  );
}
