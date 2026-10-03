import { adminClientBase } from "@/features/admin-client-view/client-routes";
import { loadAdminClientCalendar } from "@/features/admin-client-view/load-calendar";
import { FamilyCalendarView } from "@/features/family-calendar/family-calendar-view";

/**
 * Admin · client Calendar (ADM-11): the Family Calendar with tick boxes and Enter event. A
 * rejected read propagates to `error.tsx`.
 */
export default async function AdminClientCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clientId } = await params;
  const data = await loadAdminClientCalendar(clientId, await searchParams);

  return (
    <FamilyCalendarView
      clientId={clientId}
      today={data.today}
      params={data.params}
      occurrences={data.occurrences}
      log={data.log}
      actorName={data.actorName}
      basePath={adminClientBase(clientId)}
    />
  );
}
