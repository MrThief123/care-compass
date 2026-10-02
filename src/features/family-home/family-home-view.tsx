import Link from "next/link";

import { OrganisationRemovedBanner } from "@/features/family-settings/organisation-removed-banner";

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
  /** Where the links go; defaults to `/family/<id>`. A carer's Home sets it (CHG-043). */
  basePath?: string;
  /** Carers: no Enter event link and no budget 'View breakdown' link (CHG-026, CHG-043). */
  readOnly?: boolean;
  /** Read-only Home that still has Enter event: a carer on shift (CAR-07, CHG-048). */
  canAddEvent?: boolean;
  /** Family only (ADM-05): the organisation removed the client; shows a banner linking to Settings. */
  organisationRemoved?: boolean;
  /** Names the client in that banner. */
  clientFirstName?: string;
}

/**
 * Family · Home (design `family-01-home`): the Today panel beside a 340px
 * right column (Enter event, Overdue, Recent activity), and the Budget strip
 * underneath. Presentational: everything it shows comes in as props.
 *
 * The design is a two-column screen, which needs about 1280px. Below that the
 * columns stack (DECISIONS.md FD-18): Enter event, Today, then Overdue and
 * Recent activity side by side from 1024px and one under the other below it
 * (in a 308px card a normal word such as "Physiotherapy" broke mid-word).
 * Every grid item is `min-w-0`, so one long title or name can widen nothing.
 */
export function FamilyHomeView({
  clientId,
  data,
  today,
  basePath,
  readOnly = false,
  canAddEvent = false,
  organisationRemoved = false,
  clientFirstName = "your family member",
}: FamilyHomeViewProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4 px-6 py-5">
      {organisationRemoved && (
        <OrganisationRemovedBanner
          clientFirstName={clientFirstName}
          action={
            <Link
              href={`/family/${clientId}/settings`}
              className="inline-flex h-11 items-center justify-center rounded-control bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Choose organisation
            </Link>
          }
        />
      )}
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_340px] xl:grid-rows-[auto_auto_1fr]">
        {(!readOnly || canAddEvent) && (
          <div className="min-w-0 lg:col-span-2 xl:col-span-1 xl:col-start-2 xl:row-start-1">
            <EnterEventLink clientId={clientId} basePath={basePath} />
          </div>
        )}
        <div className="flex min-w-0 lg:col-span-2 xl:col-span-1 xl:col-start-1 xl:row-span-3 xl:row-start-1">
          <TodayPanel
            clientId={clientId}
            occurrences={data.today}
            dateLabel={shortDate(today)}
            basePath={basePath}
          />
        </div>
        <div className="min-w-0 xl:col-start-2 xl:row-start-2">
          <OverdueCard
            clientId={clientId}
            occurrences={data.overdue.items}
            total={data.overdue.total}
            basePath={basePath}
          />
        </div>
        <div className="min-w-0 xl:col-start-2 xl:row-start-3 xl:self-start">
          <RecentActivityCard clientId={clientId} occurrences={data.recent} basePath={basePath} />
        </div>
      </div>
      <BudgetStrip
        clientId={clientId}
        buckets={data.budget}
        basePath={basePath}
        showBreakdownLink={!readOnly}
      />
    </div>
  );
}
