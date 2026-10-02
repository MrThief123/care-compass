import { getDataSourceMode } from "@/server/data-source";
import { getOccurrences } from "@/server/events/queries";
import { OCCURRENCE_RANGE_MAX_DAYS } from "@/types/domain";

const DAY_MS = 86_400_000;

function melbourneDate(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(instant);
}

function addDays(date: string, days: number): string {
  return new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * FAM-11 (FD-07): charges the cost of every plain event that has ended and has not been charged yet.
 * A plain event is never ticked off (CHG-009), so nothing else would. Called when Budget or Family home
 * loads. Only occurrences that started after the event's cost was set are sent; the database charges each
 * once, so calling it again is harmless. Never throws: the page loads either way.
 * Returns how many costs were charged.
 */
export async function settleEndedEventCosts(
  clientId: string,
  options: { now?: Date } = {},
): Promise<number> {
  if (getDataSourceMode() === "mock") return 0;
  const now = options.now ?? new Date();

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: events, error } = await supabase
      .from("care_events")
      .select("id, cost_set_at")
      .eq("client_id", clientId)
      .not("cost", "is", null);
    if (error) throw new Error(error.code ?? "read failed");

    const costSetAt = new Map<string, number>();
    for (const event of events ?? []) {
      if (event.cost_set_at) costSetAt.set(event.id, Date.parse(event.cost_set_at));
    }
    if (costSetAt.size === 0) return 0;

    // Windows of at most OCCURRENCE_RANGE_MAX_DAYS Melbourne days, from the earliest cost to today.
    const last = melbourneDate(now);
    const items: { event_id: string; original_start: string }[] = [];
    let from = melbourneDate(new Date(Math.min(...costSetAt.values())));
    while (from <= last) {
      const to =
        addDays(from, OCCURRENCE_RANGE_MAX_DAYS - 1) < last
          ? addDays(from, OCCURRENCE_RANGE_MAX_DAYS - 1)
          : last;
      const occurrences = await getOccurrences(clientId, { from, to }, { type: "events", now });
      for (const occurrence of occurrences) {
        const setAt = costSetAt.get(occurrence.eventId);
        if (setAt === undefined) continue;
        // The key is `${eventId}:${original start}`; an event id has no colon.
        const originalStart = occurrence.key.slice(occurrence.key.indexOf(":") + 1);
        const endsAt = Date.parse(occurrence.start) + occurrence.durationMinutes * 60_000;
        if (Date.parse(originalStart) < setAt || endsAt > now.getTime()) continue;
        items.push({ event_id: occurrence.eventId, original_start: originalStart });
      }
      from = addDays(to, 1);
    }
    if (items.length === 0) return 0;

    const { data: charged, error: chargeError } = await supabase.rpc(
      "charge_ended_event_occurrences",
      { p_client_id: clientId, p_items: items },
    );
    if (chargeError) throw new Error(chargeError.code ?? "charge failed");
    return charged ?? 0;
  } catch (error) {
    console.error(
      "[budget] settleEndedEventCosts failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return 0;
  }
}
