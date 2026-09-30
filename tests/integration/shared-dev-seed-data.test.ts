// @vitest-environment node
import { spawnSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

// [F0-16] Development seed data. Needs a local Supabase stack that has just run
// `supabase db reset` (which loads supabase/seed.sql), so these tests run only when
// NEXT_PUBLIC_SUPABASE_URL is a local address and skip against a hosted project, the same
// convention as F0-11's and F0-13's integration tests. The credentials and ids below are the
// documented, local-only ones in docs/SEED_DATA.md.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const SEED_PASSWORD = "care-compass-local-1!";
const MARGARET_ID = "c0000000-0000-4000-8000-000000000001";
const BANKSIA_ID = "a0000000-0000-4000-8000-000000000001";

function anonClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function serviceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function signIn(email: string) {
  const supabase = anonClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: SEED_PASSWORD,
  });
  if (error || !data.user) throw error ?? new Error(`could not sign in as ${email}`);
  return { supabase, userId: data.user.id };
}

describe.skipIf(!hasLocalSupabase)("[F0-16] development seed data", () => {
  it("[F0-16][AC-01] Margaret's budget summary is NDIS 14880, Fixed 2750, Government 240 remaining", async () => {
    const { supabase } = await signIn("helen@example.com");

    const { data, error } = await supabase.rpc("budget_bucket_summary", {
      p_client_id: MARGARET_ID,
    });
    expect(error).toBeNull();

    const byName = Object.fromEntries((data ?? []).map((b) => [b.name, b]));
    expect(byName.NDIS).toMatchObject({ total: 24000, used: 9120, remaining: 14880 });
    expect(byName.Fixed).toMatchObject({ total: 5000, used: 2250, remaining: 2750 });
    expect(byName.Government).toMatchObject({ total: 3000, used: 2760, remaining: 240 });
  });

  it("[F0-16][AC-01] fund history matches the design and its opening balances make the totals agree", async () => {
    const { supabase } = await signIn("helen@example.com");

    const { data, error } = await supabase
      .from("budget_fund_entries")
      .select("kind, amount, description, entry_date")
      .eq("client_id", MARGARET_ID)
      .eq("kind", "funds_added")
      .order("entry_date", { ascending: false });
    expect(error).toBeNull();

    expect(data).toEqual([
      {
        kind: "funds_added",
        amount: 6000,
        description: "NDIS quarterly plan top-up",
        entry_date: "2026-11-03",
      },
      {
        kind: "funds_added",
        amount: 1000,
        description: "Fixed funding top-up",
        entry_date: "2026-10-15",
      },
      {
        kind: "funds_added",
        amount: 750,
        description: "Government subsidy payment",
        entry_date: "2026-10-01",
      },
    ]);
  });

  it("[F0-16][AC-01] the design's people, events, shifts and documents are present", async () => {
    const admin = serviceClient();

    const org = await admin.from("organisations").select("*").eq("id", BANKSIA_ID).single();
    expect(org.data).toMatchObject({
      name: "Banksia Home Care",
      abn: "54 123 456 789",
      phone: "03 9555 0102",
      address: "220 High St, Preston VIC 3072",
    });
    const orgs = await admin.from("organisations").select("id");
    expect(orgs.data?.length).toBeGreaterThanOrEqual(2);

    const clients = await admin
      .from("clients")
      .select("first_name")
      .eq("organisation_id", BANKSIA_ID);
    expect((clients.data ?? []).map((c) => c.first_name).sort()).toEqual([
      "Doris",
      "Elsie",
      "Frank",
      "Harold",
      "Jean",
      "Margaret",
      "Robert",
    ]);

    const carers = await admin
      .from("profiles")
      .select("first_name, job_title")
      .eq("organisation_id", BANKSIA_ID)
      .eq("role", "carer");
    expect((carers.data ?? []).map((c) => c.first_name).sort()).toEqual([
      "Aisha",
      "Daniel",
      "Fatima",
      "Marcus",
      "Sarah",
    ]);

    const events = await admin.from("care_events").select("title").eq("client_id", MARGARET_ID);
    expect((events.data ?? []).map((e) => e.title)).toEqual(
      expect.arrayContaining([
        "Morning medication",
        "Physiotherapy",
        "Afternoon check-in",
        "Wound dressing check",
        "Weekly weigh-in",
        "Medication review",
        "Evening medication",
      ]),
    );

    const sections = await admin
      .from("client_info_sections")
      .select("key")
      .eq("client_id", MARGARET_ID);
    expect((sections.data ?? []).map((s) => s.key).sort()).toEqual([
      "description",
      "habits",
      "medical_history",
    ]);

    const docs = await admin.from("documents").select("filename").eq("client_id", MARGARET_ID);
    expect((docs.data ?? []).map((d) => d.filename).sort()).toEqual([
      "Care plan.pdf",
      "Exercise plan.pdf",
      "Medication chart.pdf",
      "Medication schedule.pdf",
      "Physio referral.pdf",
    ]);

    // The 11:30-13:00 shift the admin conflict warning is demonstrated with.
    const conflicts = await admin.rpc("overlapping_shifts", {
      p_carer_id: "10000000-0000-4000-8000-000000000101",
      p_starts_at: "2026-11-30T12:00:00+11:00",
      p_ends_at: "2026-11-30T14:00:00+11:00",
    });
    expect(conflicts.data?.length).toBeGreaterThanOrEqual(1);
  });

  it("[F0-16][AC-02] Helen, Aisha and Priya sign in with the seed credentials and land on their role", async () => {
    const helen = await signIn("helen@example.com");
    const helenProfile = await helen.supabase
      .from("profiles")
      .select("role")
      .eq("id", helen.userId)
      .single();
    expect(helenProfile.data?.role).toBe("family");
    const linked = await helen.supabase
      .from("client_family_members")
      .select("client_id")
      .eq("profile_id", helen.userId);
    expect(linked.data).toEqual([{ client_id: MARGARET_ID }]);

    const aisha = await signIn("aisha.r@banksiahomecare.com.au");
    const aishaProfile = await aisha.supabase
      .from("profiles")
      .select("role, organisation_id")
      .eq("id", aisha.userId)
      .single();
    expect(aishaProfile.data).toEqual({ role: "carer", organisation_id: BANKSIA_ID });

    const priya = await signIn("priya.iyer@banksiahomecare.example");
    const priyaProfile = await priya.supabase
      .from("profiles")
      .select("role, organisation_id")
      .eq("id", priya.userId)
      .single();
    expect(priyaProfile.data).toEqual({ role: "admin", organisation_id: BANKSIA_ID });
  });

  it("[F0-16][AC-03] the seed script exits non-zero without writing when NODE_ENV=production", async () => {
    const admin = serviceClient();
    const before = await admin.from("documents").select("id", { count: "exact", head: true });

    const result = spawnSync(process.execPath, ["scripts/seed.mjs"], {
      env: { ...process.env, NODE_ENV: "production" },
      encoding: "utf8",
    });

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/production/i);
    const after = await admin.from("documents").select("id", { count: "exact", head: true });
    expect(after.count).toBe(before.count);
  });

  it("[F0-16][AC-03] the seed script refuses a Supabase URL that is not local", async () => {
    const result = spawnSync(process.execPath, ["scripts/seed.mjs"], {
      env: {
        ...process.env,
        NODE_ENV: "development",
        NEXT_PUBLIC_SUPABASE_URL: "https://example-project.supabase.co",
      },
      encoding: "utf8",
    });

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/local/i);
  });
});
