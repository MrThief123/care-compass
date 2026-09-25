import { FamilyCalendarView } from "@/features/family-calendar/family-calendar-view";
import { loadFamilyCalendar } from "@/features/family-calendar/load-calendar";

/**
 * Family · Calendar (FAM-UI-02). `?view=&date=&month=` picks what is drawn;
 * the visible days are read with `getOccurrences` and the Log with
 * `getTaskLog`. A rejected read propagates to `error.tsx`, and `loading.tsx`
 * shows while they run.
 */
export default async function FamilyCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clientId } = await params;
  const data = await loadFamilyCalendar(clientId, await searchParams);

  return (
    <FamilyCalendarView
      clientId={clientId}
      today={data.today}
      params={data.params}
      occurrences={data.occurrences}
      log={data.log}
      actorName={data.actorName}
    />
  );
}
