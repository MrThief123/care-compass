import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

// [FAM-11] Requires a running local Supabase stack, the app built and started with DATA_SOURCE=supabase
// against it (E2E_DATA_SOURCE=supabase) — same convention as organisation-transfer.spec.ts. The test seeds
// an organisation, a family member, a client with one NDIS bucket ($14,880 remaining), and removes them
// afterwards. Do not run it against the hosted project: it writes rows there.
const hasLocalSupabase =
  /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) &&
  process.env.E2E_DATA_SOURCE === "supabase";

const PASSWORD = "correct horse battery staple 1!";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function seed() {
  const admin = adminClient();
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const org = await admin
    .from("organisations")
    .insert({ name: `Banksia fam-11-${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("organisation");

  const email = `fam-11-helen-${stamp}@example.test`;
  const user = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (user.error || !user.data.user) throw user.error ?? new Error("helen");
  const profile = await admin.from("profiles").insert({
    id: user.data.user.id,
    role: "family",
    first_name: "Helen",
    last_name: "Doyle",
  });
  if (profile.error) throw profile.error;

  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: `Doyle-${stamp}`, organisation_id: org.data.id })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");
  const link = await admin
    .from("client_family_members")
    .insert({ client_id: client.data.id, profile_id: user.data.user.id });
  if (link.error) throw link.error;

  const bucket = await admin
    .from("budget_buckets")
    .insert({ client_id: client.data.id, name: "NDIS", kind: "ndis" })
    .select("id")
    .single();
  if (bucket.error || !bucket.data) throw bucket.error ?? new Error("bucket");
  const entry = await admin.from("budget_fund_entries").insert({
    bucket_id: bucket.data.id,
    client_id: client.data.id,
    kind: "funds_added",
    amount: 14880,
    description: "NDIS quarterly plan top-up",
    entry_date: "2026-10-01",
    recorded_by: user.data.user.id,
    recorded_by_name: "Helen Doyle",
  });
  if (entry.error) throw entry.error;

  return { admin, orgId: org.data.id, userId: user.data.user.id, email, clientId: client.data.id };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  await s.admin.auth.admin.deleteUser(s.userId);
  await s.admin.from("budget_costs").delete().eq("client_id", s.clientId);
  await s.admin.from("budget_fund_entries").delete().eq("client_id", s.clientId);
  await s.admin.from("budget_buckets").delete().eq("client_id", s.clientId);
  await s.admin.from("clients").delete().eq("id", s.clientId);
  await s.admin.from("organisations").delete().eq("id", s.orgId);
}

test.describe(() => {
  test.skip(
    !hasLocalSupabase,
    "Requires a running local Supabase stack and E2E_DATA_SOURCE=supabase — see README.",
  );

  test("[FAM-11][AC-01] T-01 Helen adds $1,000 to NDIS on Edit budget: Budget shows $15,880 and '+$1,000' first in History, still there after a reload", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto("/sign-in");
      await page.waitForLoadState("networkidle"); // hydrated, so Sign in submits through its handler
      await page.getByLabel("Email").fill(s.email);
      await page.getByLabel("Password").fill(PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));

      await page.goto(`/family/${s.clientId}/budget`);
      await expect(page.getByRole("region", { name: "Funds by source" })).toContainText("$14,880");

      await page.getByRole("link", { name: "Edit" }).click();
      await expect(page).toHaveURL(new RegExp(`/family/${s.clientId}/budget/edit$`));
      await page.waitForLoadState("networkidle");
      await page.getByRole("group", { name: "NDIS" }).getByLabel("Amount").fill("1000");
      await page.getByRole("button", { name: "Save" }).click();

      await expect(page).toHaveURL(new RegExp(`/family/${s.clientId}/budget$`));
      const funds = page.getByRole("region", { name: "Funds by source" });
      await expect(funds).toContainText("$15,880");
      const firstRow = page.getByRole("region", { name: "History" }).getByRole("row").nth(1);
      await expect(firstRow).toContainText("+$1,000");

      await page.reload();
      await expect(funds).toContainText("$15,880");
      await expect(firstRow).toContainText("+$1,000");
    } finally {
      await cleanUp(s);
    }
  });
});
