import "server-only";

import type { EmailProvider } from "@/server/email/provider";
import {
  buildOccurrences,
  type CompletionRow,
  type EventRow,
  type OverrideRow,
} from "@/server/events/build-occurrences";

import {
  ALERT_WINDOW_HOURS,
  MAX_ALERTS_PER_RUN,
  occurrenceIdentity,
  overdueAlertMessage,
  selectAlertable,
} from "./care-overdue-alerts-logic";
import { createAdminClient } from "./supabase-admin";

type AdminClient = ReturnType<typeof createAdminClient>;

interface ClientRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  organisation_id: string | null;
}

interface Recipient {
  profileId: string;
  email: string;
}

interface ProfileRow {
  id: string;
  email: string | null;
  is_active: boolean;
}

/** Event ids only: no title, name or address ever appears in the result or the logs. */
export interface CareOverdueAlertsJobResult {
  emailsSent: number;
  alertsRecorded: number;
  failures: Array<{ eventId: string }>;
}

export interface CareOverdueAlertsJobOptions {
  /** The clock; tests pass one. */
  now?: Date;
  /** Limit the run to these clients (tests); the route never passes it. */
  clientIds?: string[];
  /** Overrides MAX_ALERTS_PER_RUN (tests). */
  maxAlerts?: number;
}

const CLIENT_BATCH = 100;
const PAGE = 1000;

/** Rows in the window for a batch of clients, then the pure occurrence builder (F0-11). */
async function overdueCandidates(admin: AdminClient, clients: readonly ClientRow[], now: Date) {
  const range = {
    from: new Date(now.getTime() - ALERT_WINDOW_HOURS * 3_600_000).toISOString(),
    to: now.toISOString(),
  };
  const ids = clients.map((client) => client.id);

  const [events, overrides, completions] = await Promise.all([
    admin
      .from("care_events")
      .select(
        "id, client_id, title, description, starts_at, duration_minutes, recurrence, recurrence_until, completion_mode, is_active, deactivated_at, created_at",
      )
      .in("client_id", ids)
      .lt("starts_at", range.to),
    admin
      .from("care_event_overrides")
      .select(
        "event_id, client_id, original_start, kind, new_starts_at, new_duration_minutes, new_completion_mode",
      )
      .in("client_id", ids)
      .gte("original_start", range.from)
      .lt("original_start", range.to),
    admin
      .from("care_event_completions")
      .select("event_id, client_id, original_start, action, actor_display_name, occurred_at, seq")
      .in("client_id", ids)
      .gte("original_start", range.from)
      .lt("original_start", range.to)
      .order("seq", { ascending: true }),
  ]);
  // No database message in any error: it may name a client or a row (ARCHITECTURE.md section 12.5).
  if (events.error || overrides.error || completions.error) {
    throw new Error("care overdue alerts: could not load care events.");
  }

  const eventRows = (events.data ?? []) as (EventRow & { client_id: string })[];
  const overrideRows = (overrides.data ?? []) as (OverrideRow & { client_id: string })[];
  const completionRows = (completions.data ?? []) as (CompletionRow & { client_id: string })[];

  return clients.flatMap((client) => {
    const own = <T extends { client_id: string }>(rows: T[]) =>
      rows.filter((row) => row.client_id === client.id);
    const occurrences = buildOccurrences({
      events: own(eventRows),
      overrides: own(overrideRows),
      completions: own(completionRows),
      shifts: [],
      range,
      now,
    });
    return selectAlertable(occurrences, now).map((occurrence) => ({ client, occurrence }));
  });
}

/**
 * The client's Family plus active admins of the client's current organisation, active profiles
 * with an email only. The carer on shift is not emailed (PD-062). Own copy of INT-11's resolution
 * (that one is private to its file, INT-11 FD-08; folding the copies together is a follow-up).
 */
async function resolveRecipients(
  admin: AdminClient,
  clientId: string,
  organisationId: string | null,
): Promise<Recipient[]> {
  const links = await admin
    .from("client_family_members")
    .select("profile_id")
    .eq("client_id", clientId);
  const familyIds = (links.data ?? []).map((row) => row.profile_id as string);

  const family = familyIds.length
    ? await admin.from("profiles").select("id, email, is_active").in("id", familyIds)
    : { data: [] as ProfileRow[] };

  const admins = organisationId
    ? await admin
        .from("profiles")
        .select("id, email, is_active")
        .eq("role", "admin")
        .eq("organisation_id", organisationId)
    : { data: [] as ProfileRow[] };

  const byId = new Map<string, Recipient>();
  for (const profile of [
    ...((family.data as ProfileRow[]) ?? []),
    ...((admins.data as ProfileRow[]) ?? []),
  ]) {
    if (profile.is_active && profile.email) {
      byId.set(profile.id, { profileId: profile.id, email: profile.email });
    }
  }
  return [...byId.values()];
}

async function allClients(admin: AdminClient, only?: string[]): Promise<ClientRow[]> {
  const rows: ClientRow[] = [];
  for (let from = 0; ; from += PAGE) {
    let query = admin
      .from("clients")
      .select("id, first_name, last_name, organisation_id")
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (only) query = query.in("id", only);
    const { data, error } = await query;
    if (error) throw new Error("care overdue alerts: could not load clients.");
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE) return rows;
  }
}

/**
 * INT-09: emails each overdue task's client's Family and organisation admins once per occurrence
 * (PD-062). Called by the protected Route Handler with a real `EmailProvider`, and by
 * `tests/integration/care-overdue-alerts.test.ts` with a fake one.
 *
 * Occurrences come from the pure `buildOccurrences` over rows read here with the service role, so
 * recurrence and status are decided in one place. The marker row is written only after every
 * recipient's send succeeded, so a failure leaves no marker and the next run retries. A client
 * with no recipients is skipped without a marker. At most `maxAlerts` occurrences per run, oldest
 * due first.
 */
export async function runCareOverdueAlertsJob(
  emailProvider: EmailProvider,
  options: CareOverdueAlertsJobOptions = {},
): Promise<CareOverdueAlertsJobResult> {
  const admin = createAdminClient();
  const now = options.now ?? new Date();
  const limit = options.maxAlerts ?? MAX_ALERTS_PER_RUN;
  const result: CareOverdueAlertsJobResult = { emailsSent: 0, alertsRecorded: 0, failures: [] };

  const clients = await allClients(admin, options.clientIds);
  const candidates = [];
  for (let i = 0; i < clients.length; i += CLIENT_BATCH) {
    candidates.push(...(await overdueCandidates(admin, clients.slice(i, i + CLIENT_BATCH), now)));
  }

  // Drop what already has a marker (compared as instants: the key carries Melbourne's offset).
  const eventIds = [...new Set(candidates.map(({ occurrence }) => occurrence.eventId))];
  const alerted = new Set<string>();
  for (let i = 0; i < eventIds.length; i += CLIENT_BATCH) {
    const rows = await admin
      .from("care_overdue_alert_notifications")
      .select("event_id, original_start")
      .in("event_id", eventIds.slice(i, i + CLIENT_BATCH));
    if (rows.error) throw new Error("care overdue alerts: could not read the tracking rows.");
    for (const row of rows.data ?? [])
      alerted.add(`${row.event_id}|${Date.parse(row.original_start)}`);
  }
  const due = candidates
    .filter(({ occurrence }) => {
      const { eventId, originalStart } = occurrenceIdentity(occurrence.key);
      return !alerted.has(`${eventId}|${Date.parse(originalStart)}`);
    })
    .sort((a, b) => Date.parse(a.occurrence.start) - Date.parse(b.occurrence.start))
    .slice(0, limit);

  const recipientsByClient = new Map<string, Recipient[]>();
  for (const { client, occurrence } of due) {
    let recipients = recipientsByClient.get(client.id);
    if (!recipients) {
      recipients = await resolveRecipients(admin, client.id, client.organisation_id);
      recipientsByClient.set(client.id, recipients);
    }
    if (recipients.length === 0) continue;

    const { subject, text } = overdueAlertMessage({
      title: occurrence.title,
      clientName: [client.first_name, client.last_name].filter(Boolean).join(" "),
      start: occurrence.start,
    });
    const sends = await Promise.all(
      recipients.map((recipient) => emailProvider.send({ to: recipient.email, subject, text })),
    );
    result.emailsSent += sends.filter((send) => send.ok).length;
    if (sends.some((send) => !send.ok)) {
      result.failures.push({ eventId: occurrence.eventId });
      continue;
    }

    const { eventId, originalStart } = occurrenceIdentity(occurrence.key);
    const insert = await admin
      .from("care_overdue_alert_notifications")
      // Overlapping runs racing the same occurrence: the first wins, the other is ignored.
      .upsert(
        { event_id: eventId, original_start: originalStart },
        { onConflict: "event_id,original_start", ignoreDuplicates: true },
      )
      .select("event_id");
    if (!insert.error) result.alertsRecorded += insert.data?.length ?? 0;
  }

  return result;
}
