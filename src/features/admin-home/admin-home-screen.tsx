import { StatCard } from "@/components/shared/cards/stat-card";
import { DataTable } from "@/components/shared/lists/data-table";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { StatusPill } from "@/components/shared/status-pill";
import { CardShell } from "@/components/ui/card-shell";
import { Icon } from "@/components/ui/icon";
import type { AdminHomeData } from "@/server/admin/queries";

type Props =
  | { state?: "ready"; data: AdminHomeData }
  | { state: "loading"; data?: never }
  | { state: "error"; data?: never; onRetry?: () => void };

/** Admin-specific row composition: the shared AlertListCard only supports title/date rows. */
export function AdminHomeScreen(props: Props) {
  if (props.state === "loading") {
    return (
      <div role="status" aria-busy="true" className="space-y-5 p-6">
        <span className="sr-only">Loading Admin Home</span>
        <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1].map((key) => (
            <CardShell key={key} className="h-24 animate-pulse" />
          ))}
        </div>
        <CardShell aria-hidden="true" className="h-72 animate-pulse" />
      </div>
    );
  }
  if (props.state === "error") {
    return (
      <div role="alert" className="p-6">
        <CardShell>
          {props.onRetry ? (
            <ErrorState
              title="Unable to load Admin Home"
              body="Please try again to see your clients, staff and overdue events."
              onRetry={props.onRetry}
            />
          ) : (
            <EmptyState
              icon="alert-triangle"
              title="Unable to load Admin Home"
              body="Refresh this page to try again."
            />
          )}
        </CardShell>
      </div>
    );
  }
  const { data } = props;
  return (
    <div className="space-y-5 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section aria-label="Clients">
          <StatCard
            label="Clients"
            value={String(data.clientCount)}
            className="border-transparent p-5"
          />
        </section>
        <section aria-label="Staff">
          <StatCard
            label="Staff"
            value={String(data.staffCount)}
            className="border-transparent p-5"
          />
        </section>
      </div>
      <section aria-labelledby="admin-overdue-title">
        <CardShell tone="alert" className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="admin-overdue-title" className="text-title-section text-text-alert-strong">
              Overdue events
            </h2>
            <p className="text-body-secondary text-text-secondary">Across all Clients</p>
          </div>
          {data.overdue.length === 0 ? (
            <EmptyState
              title="All caught up"
              body="There are no overdue events across your clients."
            />
          ) : (
            <ul aria-label="Overdue events" className="space-y-2">
              {data.overdue.map((row) => (
                <li
                  key={row.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 bg-bg-surface px-2 py-3 text-body-default md:grid-cols-[minmax(80px,120px)_minmax(0,1fr)_minmax(80px,120px)_auto_16px]"
                >
                  <span className="min-w-0 break-words text-text-secondary">{row.clientName}</span>
                  <span className="col-start-1 min-w-0 break-words text-text-primary md:col-start-auto">
                    {row.eventTitle}
                  </span>
                  <span className="min-w-0 break-words text-text-secondary">{row.nurseName}</span>
                  <StatusPill status="overdue" className="justify-self-end bg-bg-alert" />
                  <Icon
                    name="chevron-right"
                    size={16}
                    aria-hidden
                    className="hidden text-text-muted md:block"
                  />
                </li>
              ))}
            </ul>
          )}
        </CardShell>
      </section>
      <section aria-labelledby="admin-upcoming-title">
        <CardShell className="space-y-5 border-transparent p-5">
          <h2 id="admin-upcoming-title" className="text-title-section text-text-primary">
            Upcoming shifts
          </h2>
          {data.upcomingShifts.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No upcoming shifts"
              body="There are no upcoming shifts scheduled."
            />
          ) : (
            <div className="overflow-x-auto">
              <DataTable
                className="min-w-[560px] [&_th]:px-0 [&_td]:px-0 [&_th]:pr-4 [&_td]:pr-4 [&_td]:break-words [&_tbody_tr]:h-11 [&_tbody_tr:last-child]:border-0 md:table-fixed md:[&_th:first-child]:w-[62%] md:[&_th:nth-child(2)]:w-[15%] md:[&_th:nth-child(3)]:w-[11%] md:[&_th:nth-child(4)]:w-[12%]"
                columns={[
                  { key: "client", header: "Client", render: (shift) => shift.clientName },
                  { key: "carer", header: "Carer", render: (shift) => shift.carerName },
                  { key: "date", header: "Date", render: (shift) => shift.date },
                  { key: "time", header: "Time", render: (shift) => shift.time },
                ]}
                rows={data.upcomingShifts}
                rowKey={(shift) => shift.id}
              />
            </div>
          )}
        </CardShell>
      </section>
    </div>
  );
}
