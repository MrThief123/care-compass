import "server-only";

import type { EmailProvider } from "@/server/email/provider";

import { createAdminClient } from "./supabase-admin";

interface DueCostRow {
  cost_id: string;
  client_id: string;
  organisation_id: string | null;
  amount: number | string;
  description: string;
  bucket_name: string;
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

type AdminClient = ReturnType<typeof createAdminClient>;

/** Cost ids only: no name, amount, title or address ever appears in the result or the logs. */
export interface PendingCostEmailsJobResult {
  emailsSent: number;
  costsRecorded: number;
  failures: Array<{ costId: string }>;
}

const EMAIL_SUBJECT = "Schedule of Care Program — pending cost";
const CLOSING = "Add funds to pay it. Log in and refer to plan.";

const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function costLine(row: DueCostRow): string {
  return `A cost of ${money.format(Number(row.amount))} for ${row.description} could not be covered by ${row.bucket_name} and is pending.`;
}

/** One cost: the approved sentence exactly (FD-06). Several (digest, FD-03): one line per cost,
 * the closing sentence once at the end. */
function emailBody(rows: readonly DueCostRow[]): string {
  const lines = rows.map(costLine);
  return lines.length === 1 ? `${lines[0]} ${CLOSING}` : `${lines.join("\n")}\n\n${CLOSING}`;
}

/**
 * The client's Family plus active admins of the client's current organisation, active profiles
 * with an email only (FD-04). Own copy of INT-01's resolution: that one is private to
 * budget-thresholds.ts, which this feature does not edit (FD-08).
 */
async function resolveRecipients(
  supabase: AdminClient,
  clientId: string,
  organisationId: string | null,
): Promise<Recipient[]> {
  const links = await supabase
    .from("client_family_members")
    .select("profile_id")
    .eq("client_id", clientId);
  const familyIds = (links.data ?? []).map((row) => row.profile_id as string);

  const family = familyIds.length
    ? await supabase.from("profiles").select("id, email, is_active").in("id", familyIds)
    : { data: [] as ProfileRow[] };

  const admins = organisationId
    ? await supabase
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

/**
 * INT-11: emails each client's Family and organisation admins once per pending cost. Called by
 * the protected Route Handler with a real `EmailProvider`, and by
 * `tests/integration/pending-cost-emails.test.ts` with a fake one.
 *
 * Costs due in the same run for the same client go in one email per recipient (digest). The
 * marker rows (`budget_pending_cost_notifications`) are written only after every recipient's
 * send succeeded, so a failure leaves no marker and the next run retries the client's batch.
 * A client with no recipients is skipped without a marker.
 */
export async function runPendingCostEmailsJob(
  emailProvider: EmailProvider,
): Promise<PendingCostEmailsJobResult> {
  const supabase = createAdminClient();
  const result: PendingCostEmailsJobResult = { emailsSent: 0, costsRecorded: 0, failures: [] };

  const due = await supabase.rpc("budget_pending_costs_to_notify");
  const rows = (due.data ?? []) as DueCostRow[];

  const byClient = new Map<string, DueCostRow[]>();
  for (const row of rows) {
    byClient.set(row.client_id, [...(byClient.get(row.client_id) ?? []), row]);
  }

  for (const costs of byClient.values()) {
    const recipients = await resolveRecipients(
      supabase,
      costs[0].client_id,
      costs[0].organisation_id,
    );
    if (recipients.length === 0) continue;

    const text = emailBody(costs);
    const sends = await Promise.all(
      recipients.map((recipient) =>
        emailProvider.send({ to: recipient.email, subject: EMAIL_SUBJECT, text }),
      ),
    );
    result.emailsSent += sends.filter((send) => send.ok).length;
    if (sends.some((send) => !send.ok)) {
      for (const cost of costs) result.failures.push({ costId: cost.cost_id });
      continue;
    }

    const insert = await supabase
      .from("budget_pending_cost_notifications")
      // Overlapping runs racing the same cost: the first wins, the other is ignored.
      .upsert(
        costs.map((cost) => ({ cost_id: cost.cost_id })),
        { onConflict: "cost_id", ignoreDuplicates: true },
      )
      .select("cost_id");
    if (!insert.error) result.costsRecorded += insert.data?.length ?? 0;
  }

  return result;
}
