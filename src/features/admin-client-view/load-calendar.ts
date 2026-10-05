import { parseCalendarParams, visibleRange } from "@/features/family-calendar/calendar-params";
import { selectLog, type FamilyCalendarData } from "@/features/family-calendar/load-calendar";
import { getCurrentUser } from "@/server/auth/queries";
import { getClientShifts, getOccurrences, getTaskLog, getToday } from "@/server/events/queries";

/**
 * `loadFamilyCalendar` for an admin session (ADM-11 FD-07). That loader checks the signed-in role
 * against "family" or "carer" only, and Lane F is not edited beyond FD-02, so this reads the same
 * contract functions with the admin guard.
 */
export async function loadAdminClientCalendar(
  clientId: string,
  search: Record<string, string | string[] | undefined>,
): Promise<FamilyCalendarData> {
  const today = await getToday();
  const params = parseCalendarParams(search, today);
  const [occurrences, taskLog, user, shifts] = await Promise.all([
    getOccurrences(clientId, visibleRange(params)),
    getTaskLog(clientId),
    getCurrentUser("admin"),
    getClientShifts(clientId, visibleRange(params)),
  ]);
  return {
    today,
    params,
    occurrences,
    log: selectLog(taskLog.items),
    shifts,
    actorName: `${user.firstName} ${user.lastName}`,
  };
}
