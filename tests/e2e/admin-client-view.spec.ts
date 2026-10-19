import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

import { totpCode } from "../helpers/totp";

import type { Page } from "@playwright/test";

loadEnv({ path: ".env.local" });

// [ADM-11] Writes organisations, people, a client, a bucket and an event to the database it points at, so it
// only runs against a LOCAL Supabase stack with the app started on the same stack and DATA_SOURCE=supabase
// (same setup as tests/e2e/admin-staff-panel.spec.ts):
//   E2E_PORT=3210 E2E_DATA_SOURCE=supabase NEXT_PUBLIC_SUPABASE_URL=... npx playwright test tests/e2e/admin-client-view.spec.ts
// (the three Supabase variables come from `supabase status -o env`; `.env.local` is the hosted project).
// The Admin mock clients do not match the Family mock fixtures (FD-06), so there is no mock-mode run.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const enabled =
  isLocalUrl &&
  process.env.E2E_DATA_SOURCE === "supabase" &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/** Priya (admin) and Margaret in one organisation; Wendy (admin) in another. Fresh each run. */
async function seed() {
  const admin = db();
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const orgs = await admin
    .from("organisations")
    .insert([{ name: `adm-11-${stamp}` }, { name: `adm-11-other-${stamp}` }])
    .select("id");
  if (orgs.error || orgs.data?.length !== 2) throw orgs.error ?? new Error("orgs");
  const [orgId, otherOrgId] = [orgs.data[0]!.id, orgs.data[1]!.id];

  async function person(
    label: string,
    role: "admin" | "family",
    first: string,
    org: string | null,
  ) {
    const email = `adm-11-${label}-${stamp}@example.test`;
    const user = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (user.error || !user.data.user) throw user.error ?? new Error("user");
    const profile = await admin.from("profiles").insert({
      id: user.data.user.id,
      role,
      organisation_id: org,
      first_name: first,
      last_name: "Test",
      email,
    });
    if (profile.error) throw profile.error;
    return { id: user.data.user.id, email };
  }
  const priya = await person("priya", "admin", "Priya", orgId);
  const wendy = await person("wendy", "admin", "Wendy", otherOrgId);
  const helen = await person("helen", "family", "Helen", null);

  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: `Doyle-${stamp}`, organisation_id: orgId })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");
  await admin
    .from("client_family_members")
    .insert({ client_id: client.data.id, profile_id: helen.id });

  const bucket = await admin
    .from("budget_buckets")
    .insert({ client_id: client.data.id, name: "NDIS", kind: "ndis" })
    .select("id")
    .single();
  if (bucket.error || !bucket.data) throw bucket.error ?? new Error("bucket");
  await admin.from("budget_fund_entries").insert({
    bucket_id: bucket.data.id,
    client_id: client.data.id,
    kind: "funds_added",
    amount: 14880,
    description: "NDIS quarterly plan top-up",
    entry_date: "2026-10-01",
    recorded_by: helen.id,
    recorded_by_name: "Helen Test",
  });
  await admin.from("care_events").insert({
    client_id: client.data.id,
    title: "Morning medication",
    starts_at: new Date(Math.floor(Date.now() / 1000) * 1000).toISOString(),
    duration_minutes: 15,
    completion_mode: "manual",
    created_by: helen.id,
  });

  return { stamp, orgId, otherOrgId, priya, wendy, helen, clientId: client.data.id };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  const admin = db();
  await admin.from("care_event_completions").delete().eq("client_id", s.clientId);
  await admin.from("care_events").delete().eq("client_id", s.clientId);
  await admin.from("budget_costs").delete().eq("client_id", s.clientId);
  await admin.from("budget_fund_entries").delete().eq("client_id", s.clientId);
  await admin.from("budget_buckets").delete().eq("client_id", s.clientId);
  await admin.from("clients").delete().eq("id", s.clientId);
  for (const id of [s.priya.id, s.wendy.id, s.helen.id]) await admin.auth.admin.deleteUser(id);
  await admin.from("organisations").delete().in("id", [s.orgId, s.otherOrgId]);
}

async function signInAsAdmin(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/mfa\/enroll$/);
  const key = (await page.getByTestId("mfa-manual-key").textContent())?.trim();
  if (!key) throw new Error("no manual key on the enrol page");
  await page.getByLabel("6-digit code").fill(totpCode(key));
  await page.getByRole("button", { name: /verify and continue/i }).click();
  await expect(page).toHaveURL(/\/admin\/home$/);
}

test.describe("[ADM-11] Admin client view against real data", () => {
  test.skip(!enabled, "Needs local Supabase and E2E_DATA_SOURCE=supabase, see the comment above.");

  test("[ADM-11][AC-01] clicking a client's name opens their Family Home in the admin layout, with the client bar and a Back link", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await signInAsAdmin(page, s.priya.email);
      await page.goto("/admin/clients");
      await page.getByRole("link", { name: `Margaret Doyle-${s.stamp}` }).click();

      await expect(page).toHaveURL(new RegExp(`/admin/clients/${s.clientId}/home$`));
      await expect(page.getByRole("link", { name: "Back to clients" })).toBeVisible();
      await expect(page.getByText(`Margaret Doyle-${s.stamp}`).first()).toBeVisible();
      // Still the admin shell: the admin rail is there, and Family's Settings is not.
      await expect(page.getByRole("link", { name: "Clients" }).first()).toBeVisible();
      await expect(page.getByText("Morning medication").first()).toBeVisible();

      await page.getByRole("link", { name: "Back to clients" }).click();
      await expect(page).toHaveURL(/\/admin\/clients$/);
    } finally {
      await cleanUp(s);
    }
  });

  test("[ADM-11][AC-02] moving between Home, Client Details, Calendar, Budget and Care log keeps the client and never leaves /admin/clients/<id>/", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await signInAsAdmin(page, s.priya.email);
      await page.goto(`/admin/clients/${s.clientId}/home`);

      const nav = page.getByRole("navigation", { name: "Client screens" });
      for (const [label, segment] of [
        ["Client Details", "info"],
        ["Calendar", "calendar"],
        ["Budget", "budget"],
        ["Care log", "tasks"],
        ["Home", "home"],
      ] as const) {
        await nav.getByRole("link", { name: label }).click();
        await expect(page).toHaveURL(new RegExp(`/admin/clients/${s.clientId}/${segment}`));
        await expect(nav.getByRole("link", { name: label })).toHaveAttribute(
          "aria-current",
          "page",
        );
        for (const link of await page.locator("main a[href]").all()) {
          const href = (await link.getAttribute("href")) ?? "";
          expect(href, `a link on ${label} leaves the client view`).not.toMatch(/^\/family\//);
        }
      }
      await nav.getByRole("link", { name: "Budget" }).click();
      await expect(page.getByRole("region", { name: "Funds by source" })).toContainText("$14,880");
    } finally {
      await cleanUp(s);
    }
  });

  test("[ADM-11][AC-03] Priya adds $500 to NDIS on Edit budget: Budget shows $15,380, History says recorded by her, and Edit budget returns under the client view", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await signInAsAdmin(page, s.priya.email);
      await page.goto(`/admin/clients/${s.clientId}/budget`);

      await page.getByRole("link", { name: "Edit" }).click();
      await expect(page).toHaveURL(new RegExp(`/admin/clients/${s.clientId}/budget/edit$`));
      await page.waitForLoadState("networkidle");
      await page.getByRole("group", { name: "NDIS" }).getByLabel("Amount").fill("500");
      await page.getByRole("button", { name: "Save" }).click();

      await expect(page).toHaveURL(new RegExp(`/admin/clients/${s.clientId}/budget$`));
      await expect(page.getByRole("region", { name: "Funds by source" })).toContainText("$15,380");
      await expect(page.getByTitle("Recorded by Priya Test")).toBeVisible();
    } finally {
      await cleanUp(s);
    }
  });

  test("[ADM-11][AC-05] another organisation's admin, an unknown id and a malformed id each get the not-found page", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signInAsAdmin(page, s.wendy.email);
      for (const id of [s.clientId, "b9999999-9999-9999-9999-999999999999", "not-a-client"]) {
        for (const segment of ["home", "info", "budget"]) {
          await page.goto(`/admin/clients/${id}/${segment}`);
          await expect(page.getByText("This page could not be found")).toBeVisible();
          await expect(page.getByText("Morning medication")).toHaveCount(0);
        }
      }
    } finally {
      await cleanUp(s);
    }
  });
});
