// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import type { EmailMessage, EmailProvider } from "@/server/email/provider";
import { runBudgetThresholdsJob } from "@/server/jobs/budget-thresholds";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`, migrations applied — this
// feature's migration, 20261001080936_budget_threshold_notifications.sql), the same
// convention as F0-13's and F0-17's integration tests. If `.env.local` points at a hosted
// project, override the three variables from `npx supabase status -o env` for the run. The
// table/function's shape and RLS are covered separately by
// supabase/tests/budget_threshold_notifications.test.sql, which CI runs without Docker-in-CI
// constraints.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

function unique(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** The "test double" the PRD asks for (Scope: "Email provider adapter interface with a test
 * double"). Records every send; `shouldFail` makes every send resolve `{ ok: false }` without
 * throwing, for AC-05. */
class FakeEmailProvider implements EmailProvider {
  sent: EmailMessage[] = [];
  shouldFail = false;

  async send(message: EmailMessage): Promise<{ ok: true } | { ok: false; error: string }> {
    if (this.shouldFail) return { ok: false, error: "simulated provider outage" };
    this.sent.push(message);
    return { ok: true };
  }
}

/** Untyped access: `budget_threshold_notifications`/`budget_thresholds_snapshot` are not in
 * the generated types yet (same reasoning as `src/server/documents/db.ts`, F0-13). */
function notificationsAdmin() {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (admin.from as unknown as (table: string) => any)("budget_threshold_notifications");
}

async function seedScenario() {
  const admin = createAdminClient();
  const stamp = unique("int-01");

  const org = await admin
    .from("organisations")
    .insert({ name: `Banksia ${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  const family = await admin.auth.admin.createUser({
    email: `${stamp}-helen@example.test`,
    password: "correct horse battery staple 1!",
    email_confirm: true,
  });
  if (family.error || !family.data.user) throw family.error ?? new Error("family user");
  const familyProfile = await admin
    .from("profiles")
    .insert({
      id: family.data.user.id,
      role: "family",
      first_name: "Helen",
      last_name: "Doyle",
      email: family.data.user.email,
      is_active: true,
    })
    .select("id")
    .single();
  if (familyProfile.error) throw familyProfile.error;

  const admin1 = await admin.auth.admin.createUser({
    email: `${stamp}-priya@example.test`,
    password: "correct horse battery staple 1!",
    email_confirm: true,
  });
  if (admin1.error || !admin1.data.user) throw admin1.error ?? new Error("admin user");
  const adminProfile = await admin
    .from("profiles")
    .insert({
      id: admin1.data.user.id,
      role: "admin",
      organisation_id: org.data.id,
      first_name: "Priya",
      last_name: "Nair",
      email: admin1.data.user.email,
      is_active: true,
    })
    .select("id")
    .single();
  if (adminProfile.error) throw adminProfile.error;

  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: unique("Wells"), organisation_id: org.data.id })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");

  const link = await admin
    .from("client_family_members")
    .insert({ client_id: client.data.id, profile_id: family.data.user.id });
  if (link.error) throw link.error;

  const bucket = await admin
    .from("budget_buckets")
    .insert({ client_id: client.data.id, name: "Government" })
    .select("id")
    .single();
  if (bucket.error || !bucket.data) throw bucket.error ?? new Error("bucket");

  const funds = await admin.from("budget_fund_entries").insert({
    bucket_id: bucket.data.id,
    client_id: client.data.id,
    kind: "bucket_added",
    amount: 1000,
    recorded_by: family.data.user.id,
    recorded_by_name: "Helen Doyle",
  });
  if (funds.error) throw funds.error;

  return {
    admin,
    orgId: org.data.id as string,
    familyUserId: family.data.user.id,
    familyEmail: family.data.user.email as string,
    adminUserId: admin1.data.user.id,
    adminEmail: admin1.data.user.email as string,
    clientId: client.data.id as string,
    bucketId: bucket.data.id as string,
  };
}

/** Charges `amount` as a paid cost this period, crossing whatever threshold that percentage reaches. */
async function chargeCost(bucketId: string, clientId: string, amount: number) {
  const admin = createAdminClient();
  const { error } = await admin.from("budget_costs").insert({
    bucket_id: bucketId,
    client_id: clientId,
    original_start: new Date().toISOString(),
    description: "Physio",
    amount,
    status: "paid",
    incurred_on: new Date().toISOString().slice(0, 10),
    paid_on: new Date().toISOString().slice(0, 10),
    recorded_by: "00000000-0000-0000-0000-000000000000",
    recorded_by_name: "Test",
  });
  if (error) throw error;
}

async function cleanUp(s: Awaited<ReturnType<typeof seedScenario>>) {
  await s.admin.auth.admin.deleteUser(s.familyUserId);
  await s.admin.auth.admin.deleteUser(s.adminUserId);
  await s.admin.from("clients").delete().eq("id", s.clientId);
  await s.admin.from("organisations").delete().eq("id", s.orgId);
}

describe.skipIf(!hasLocalSupabase)("[INT-01] budget threshold emails", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("[INT-01][AC-01] T-01 crossing the top threshold emails every eligible recipient with the client's name and percentage", async () => {
    const s = await seedScenario();
    try {
      await chargeCost(s.bucketId, s.clientId, 1000); // 100% — depleted: every threshold is due
      const provider = new FakeEmailProvider();

      const result = await runBudgetThresholdsJob(provider);

      expect(result.failures).toEqual([]);
      // Three thresholds (75/85/100) × two recipients (Helen, Priya) = six emails.
      expect(provider.sent).toHaveLength(6);
      const recipients = provider.sent.map((message) => message.to).sort();
      expect(recipients).toEqual(
        [
          s.adminEmail,
          s.adminEmail,
          s.adminEmail,
          s.familyEmail,
          s.familyEmail,
          s.familyEmail,
        ].sort(),
      );
      for (const message of provider.sent) {
        expect(message.text).toContain("Margaret");
        expect(message.text).toMatch(/\d+%/);
      }
    } finally {
      await cleanUp(s);
    }
  }, 15000);

  it("[INT-01][AC-02] T-02 running again in the same period sends nothing more", async () => {
    const s = await seedScenario();
    try {
      await chargeCost(s.bucketId, s.clientId, 760); // 76% — warning only
      const provider = new FakeEmailProvider();

      const first = await runBudgetThresholdsJob(provider);
      expect(first.emailsSent).toBe(2); // Helen + Priya, once

      const second = await runBudgetThresholdsJob(provider);

      expect(second.emailsSent).toBe(0);
      expect(provider.sent).toHaveLength(2);
    } finally {
      await cleanUp(s);
    }
  }, 15000);

  it("[INT-01][AC-03] T-03 a previous organisation's admin gets no email after the client transfers away", async () => {
    const s = await seedScenario();
    try {
      const otherOrg = await s.admin
        .from("organisations")
        .insert({ name: `Wattle ${unique("int-01")}` })
        .select("id")
        .single();
      if (otherOrg.error || !otherOrg.data) throw otherOrg.error ?? new Error("other org");
      const moved = await s.admin
        .from("clients")
        .update({ organisation_id: otherOrg.data.id })
        .eq("id", s.clientId);
      if (moved.error) throw moved.error;

      await chargeCost(s.bucketId, s.clientId, 760);
      const provider = new FakeEmailProvider();

      await runBudgetThresholdsJob(provider);

      const recipients = provider.sent.map((message) => message.to);
      expect(recipients).toContain(s.familyEmail);
      expect(recipients).not.toContain(s.adminEmail); // Priya: admin of the *previous* org

      await s.admin.from("organisations").delete().eq("id", otherOrg.data.id);
    } finally {
      await cleanUp(s);
    }
  }, 15000);

  it("[INT-01][AC-05] T-05 a provider failure leaves the threshold unrecorded, so the next run retries it", async () => {
    const s = await seedScenario();
    try {
      await chargeCost(s.bucketId, s.clientId, 760);
      const failing = new FakeEmailProvider();
      failing.shouldFail = true;

      const first = await runBudgetThresholdsJob(failing);
      expect(first.emailsSent).toBe(0);
      expect(first.failures).toHaveLength(1);

      const recorded = await notificationsAdmin().select("id").eq("bucket_id", s.bucketId);
      expect(recorded.data).toEqual([]);

      const working = new FakeEmailProvider();
      const second = await runBudgetThresholdsJob(working);

      expect(second.emailsSent).toBe(2);
      expect(working.sent).toHaveLength(2);
    } finally {
      await cleanUp(s);
    }
  }, 15000);

  it("[INT-01][AC-04] T-04 the job endpoint rejects a request without the secret and does nothing", async () => {
    vi.stubEnv("JOBS_SECRET", "a-real-secret");
    const { POST } = await import("@/app/api/jobs/budget-thresholds/route");

    const response = await POST(
      new Request("http://localhost/api/jobs/budget-thresholds", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    const wrongSecret = await POST(
      new Request("http://localhost/api/jobs/budget-thresholds", {
        method: "POST",
        headers: { "x-jobs-secret": "not-it" },
      }),
    );
    expect(wrongSecret.status).toBe(401);
  });
});
