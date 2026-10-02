import "server-only";

import type { EmailProvider } from "@/server/email/provider";

import { createAdminClient } from "./supabase-admin";

/** PD-032: the three warning levels, a single configuration constant (OQ-03). */
const THRESHOLDS = [75, 85, 100] as const;

/** Every threshold the bucket's spending this period has reached (PRD Functional Requirements:
 * a bucket that jumps past several thresholds in one spend sends each one, not only the
 * highest). Read from `percent_used`, not F0-12's `threshold_state`: that state also turns
 * 'depleted' when a cost is merely pending (PD-058), which would email "reached 40%" against
 * the 100% threshold (DECISIONS.md FD-04). */
function thresholdsMet(percentUsed: number | null): readonly number[] {
  if (percentUsed === null) return [];
  return THRESHOLDS.filter((threshold) => percentUsed >= threshold);
}

interface SnapshotRow {
  bucket_id: string;
  client_id: string;
  client_name: string;
  organisation_id: string | null;
  percent_used: number | null;
  threshold_state: string;
  period_start: string;
}

interface Recipient {
  profileId: string;
  email: string;
}

const EMAIL_SUBJECT = "Schedule of Care Program — budget update";

/** INT-10 (FD-01): names the bucket. No bucket name (removed mid-run) falls back to INT-01's wording. */
function emailBody(clientName: string, percent: number, bucketName: string | undefined): string {
  const allocation = bucketName ? `its ${bucketName} allocation` : "its allocation";
  return `The Schedule of Care Program for ${clientName} has reached ${percent}% of ${allocation} for the present period. Log in and refer to plan.`;
}

export interface BudgetThresholdsJobResult {
  emailsSent: number;
  thresholdsRecorded: number;
  failures: Array<{ bucketId: string; threshold: number; error: string }>;
}

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * The recipients for one bucket's threshold email (OQ-28): the client's family, plus active
 * admins of the client's *current* organisation — read fresh here, so a client transferred away
 * from an organisation never reaches that organisation's admin (AC-03), without any extra logic.
 * Inactive profiles are excluded (Scope).
 */
interface ProfileRow {
  id: string;
  email: string | null;
  is_active: boolean;
}

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
 * INT-01: runs every eligible threshold email once. Called by the protected Route Handler
 * (`/api/jobs/budget-thresholds`) with a real `EmailProvider`, and directly by
 * `tests/integration/budget-thresholds.test.ts` with a `FakeEmailProvider` — the job takes only
 * the provider as a parameter (never a Supabase client: creating one is confined to this
 * directory, ADR-02, `eslint.config.mjs`) and makes its own `createAdminClient()` internally,
 * matching the "email provider adapter interface with a test double" PRD line.
 *
 * Idempotent (AC-02): `budget_threshold_notifications` (bucket_id, threshold, period_start) is
 * only inserted after every recipient's email succeeds for that threshold, so a provider failure
 * leaves nothing recorded and the next run retries the whole threshold (AC-05) — a partial
 * failure (one of several recipients) is treated the same way, deliberately simple given the PRD
 * does not specify per-recipient tracking (DECISIONS.md FD-01).
 */
export async function runBudgetThresholdsJob(
  emailProvider: EmailProvider,
): Promise<BudgetThresholdsJobResult> {
  const supabase = createAdminClient();
  const result: BudgetThresholdsJobResult = { emailsSent: 0, thresholdsRecorded: 0, failures: [] };

  const snapshot = await supabase.rpc("budget_thresholds_snapshot");
  const rows = (snapshot.data ?? []) as SnapshotRow[];
  const due = rows.filter((row) => thresholdsMet(row.percent_used).length > 0);
  if (due.length === 0) return result;

  const bucketIds = [...new Set(due.map((row) => row.bucket_id))];
  const sent = await supabase
    .from("budget_threshold_notifications")
    .select("bucket_id, threshold, period_start")
    .in("bucket_id", bucketIds);
  const alreadySent = new Set(
    (sent.data ?? []).map((row) => `${row.bucket_id}:${row.threshold}:${row.period_start}`),
  );

  const names = await supabase.from("budget_buckets").select("id, name").in("id", bucketIds);
  const bucketNames = new Map(
    (names.data ?? []).map((row) => [row.id as string, row.name as string]),
  );

  for (const row of due) {
    const percent = row.percent_used ?? 0;
    const newThresholds = thresholdsMet(row.percent_used).filter(
      (threshold) => !alreadySent.has(`${row.bucket_id}:${threshold}:${row.period_start}`),
    );

    for (const threshold of newThresholds) {
      const recipients = await resolveRecipients(supabase, row.client_id, row.organisation_id);
      if (recipients.length === 0) continue;

      const sends = await Promise.all(
        recipients.map((recipient) =>
          emailProvider.send({
            to: recipient.email,
            subject: EMAIL_SUBJECT,
            text: emailBody(row.client_name, percent, bucketNames.get(row.bucket_id)),
          }),
        ),
      );
      const failed = sends.find((send) => !send.ok);
      if (failed && !failed.ok) {
        result.failures.push({ bucketId: row.bucket_id, threshold, error: failed.error });
        continue;
      }

      result.emailsSent += sends.length;
      const insert = await supabase
        .from("budget_threshold_notifications")
        .upsert(
          { bucket_id: row.bucket_id, threshold, period_start: row.period_start },
          // Two overlapping runs racing the same threshold: whichever gets here first wins,
          // the other is silently ignored rather than erroring (AC-02's unique constraint).
          { onConflict: "bucket_id,threshold,period_start", ignoreDuplicates: true },
        )
        .select("id");
      if (!insert.error) result.thresholdsRecorded += 1;
    }
  }

  return result;
}
