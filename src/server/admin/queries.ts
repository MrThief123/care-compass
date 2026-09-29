import { ADMIN_HOME } from "@/mocks/admin-home";
import { getDataSourceMode } from "@/server/data-source";
import { isPlainEvent } from "@/types/domain";

export interface AdminHomeData {
  clientCount: number;
  staffCount: number;
  upcomingShifts: {
    id: string;
    clientName: string;
    carerName: string;
    date: string;
    time: string;
  }[];
  overdue: { id: string; clientName: string; eventTitle: string; nurseName: string }[];
}

/**
 * ADM-01: the overdue window (PRD Technical Considerations, PROPOSED default, feature DECISIONS.md
 * FD-01) and the row caps on overdue and upcoming shifts (PRD Error/Edge Cases' PROPOSED "20 newest",
 * applied to both lists since neither has a "load more" control built).
 */
const OVERDUE_WINDOW_DAYS = 30;
const ROW_LIMIT = 20;

const SHIFT_TIME_FORMATTER = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function fullName(firstName: string | null, lastName: string | null): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown";
}

/** e.g. "09:00–11:00" (Melbourne, 24-hour): no shared formatter exists for a time range (Lane S owns
 * `src/lib/format/date.ts`), so this stays local to admin-home rather than editing shared code. */
function formatShiftTimeRange(startIso: string, endIso: string): string {
  const format = (iso: string) => SHIFT_TIME_FORMATTER.format(new Date(iso));
  return `${format(startIso)}–${format(endIso)}`;
}

/** A Melbourne calendar date (`YYYY-MM-DD`) `days` earlier, calendar arithmetic (same technique as
 * `melbourneDaysToInstants`'s day-after computation in `src/server/events/occurrences.ts`). */
function daysBeforeMelbourne(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10);
}

/**
 * Organisation-wide counts and overdue events (ADM-01), and upcoming shifts (CHG-034, feature
 * DECISIONS.md FD-01). RLS alone scopes every read to the signed-in admin's organisation (no
 * `organisation_id` filter is passed): `clients`/`profiles`/`shifts` all resolve `is_admin_of_client`
 * per row, so a plain `select` already returns only this organisation's rows (AC-03).
 *
 * Overdue has no org-wide SQL aggregate to call (recurrence expansion is TypeScript, F0-09, not SQL —
 * an RPC would duplicate it, CLAUDE.md §7), so each of the organisation's clients is read with the same
 * `loadOccurrences` a client dashboard uses, in parallel, over a 30-day window ending today; the
 * assignee ("nurse") is `Occurrence.assignee`, already the full name `client_shift_carers` derives
 * (PD-055, PD-038).
 */
export async function getAdminHome(): Promise<AdminHomeData> {
  const mode = getDataSourceMode();
  if (mode === "mock") return structuredClone(ADMIN_HOME);

  const { createClient } = await import("@/lib/supabase/server");
  const { formatShortDate } = await import("@/lib/format/date");
  const supabase = await createClient();

  const [clientsResult, staffCountResult] = await Promise.all([
    supabase.from("clients").select("id, first_name, last_name"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "carer")
      .eq("is_active", true),
  ]);
  // Neither message names a client or a row (ARCHITECTURE.md §12.5).
  if (clientsResult.error || !clientsResult.data) {
    throw new Error("getAdminHome: could not load the organisation's clients.");
  }
  if (staffCountResult.error) {
    throw new Error("getAdminHome: could not load the organisation's staff.");
  }

  const clients = clientsResult.data;
  const clientName = (clientId: string) =>
    fullName(
      clients.find((client) => client.id === clientId)?.first_name ?? null,
      clients.find((client) => client.id === clientId)?.last_name ?? null,
    );

  const { getToday } = await import("@/server/events/queries");
  const { loadOccurrences, melbourneDaysToInstants } = await import("@/server/events/occurrences");
  const today = await getToday();
  const range = melbourneDaysToInstants({
    from: daysBeforeMelbourne(today, OVERDUE_WINDOW_DAYS - 1),
    to: today,
  });
  const now = new Date();

  const perClientOccurrences = await Promise.all(
    clients.map((client) => loadOccurrences(client.id, range, now)),
  );

  const overdue = perClientOccurrences
    .flatMap((occurrences) =>
      occurrences.filter(
        (occurrence) => !isPlainEvent(occurrence) && occurrence.status === "overdue",
      ),
    )
    .sort((a, b) => Date.parse(b.start) - Date.parse(a.start))
    .slice(0, ROW_LIMIT)
    .map((occurrence) => ({
      id: occurrence.key,
      clientName: clientName(occurrence.clientId),
      eventTitle: occurrence.title,
      nurseName: occurrence.assignee ?? "—",
    }));

  const { data: shiftRows, error: shiftsError } = await supabase
    .from("shifts")
    .select(
      "id, starts_at, ends_at, client:clients(first_name, last_name), carer:profiles!shifts_carer_id_fkey(first_name, last_name)",
    )
    .is("cancelled_at", null)
    .gt("starts_at", now.toISOString())
    .order("starts_at", { ascending: true })
    .limit(ROW_LIMIT);
  if (shiftsError || !shiftRows) {
    throw new Error("getAdminHome: could not load upcoming shifts.");
  }

  const upcomingShifts = shiftRows.map((row) => ({
    id: row.id,
    clientName: row.client ? fullName(row.client.first_name, row.client.last_name) : "Unknown",
    carerName: row.carer ? fullName(row.carer.first_name, row.carer.last_name) : "Unknown",
    date: formatShortDate(row.starts_at),
    time: formatShiftTimeRange(row.starts_at, row.ends_at),
  }));

  return {
    clientCount: clients.length,
    staffCount: staffCountResult.count ?? 0,
    upcomingShifts,
    overdue,
  };
}
