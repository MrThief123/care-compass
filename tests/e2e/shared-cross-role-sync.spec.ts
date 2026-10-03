import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

import { totpCode } from "../helpers/totp";

import type { Browser, Page } from "@playwright/test";

loadEnv({ path: ".env.local" });

// Cross-role sync in a real browser: family, a carer on shift and the organisation admin are signed in at
// the same time, each in their own browser context. One of them saves Habits; the other two, who already
// have the Info screen open, move to another screen and back using the app's own links (no reload) and must
// read the new text: no stale page, no stale client-side cache. Local Supabase stack only, like
// tests/e2e/admin-client-view.spec.ts:
//   E2E_PORT=3210 E2E_DATA_SOURCE=supabase NEXT_PUBLIC_SUPABASE_URL=... npx playwright test tests/e2e/shared-cross-role-sync.spec.ts
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const enabled =
  isLocalUrl &&
  process.env.E2E_DATA_SOURCE === "supabase" &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const HOUR = 3_600_000;

type Role = "family" | "carer" | "admin";
const ROLES: Role[] = ["family", "carer", "admin"];

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function seed() {
  const admin = db();
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const org = await admin
    .from("organisations")
    .insert({ name: `sync-${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  async function person(role: Role, first: string, organisationId: string | null) {
    const email = `sync-${role}-${stamp}@example.test`;
    const user = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (user.error || !user.data.user) throw user.error ?? new Error("user");
    const profile = await admin.from("profiles").insert({
      id: user.data.user.id,
      role,
      organisation_id: organisationId,
      first_name: first,
      last_name: "Test",
      email,
    });
    if (profile.error) throw profile.error;
    return { id: user.data.user.id, email };
  }
  const people = {
    family: await person("family", "Helen", null),
    carer: await person("carer", "Aisha", org.data.id),
    admin: await person("admin", "Priya", org.data.id),
  };

  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: `Doyle-${stamp}`, organisation_id: org.data.id })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");
  await admin
    .from("client_family_members")
    .insert({ client_id: client.data.id, profile_id: people.family.id });
  const now = Date.now();
  const shift = await admin.from("shifts").insert({
    client_id: client.data.id,
    carer_id: people.carer.id,
    starts_at: new Date(now - 6 * HOUR).toISOString(),
    ends_at: new Date(now + 6 * HOUR).toISOString(),
  });
  if (shift.error) throw shift.error;
  await admin.from("client_info_sections").insert({
    client_id: client.data.id,
    key: "habits",
    body: "Tea at 7am.",
    updated_by: people.family.id,
  });

  return { admin, orgId: org.data.id, people, clientId: client.data.id };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  await s.admin.from("client_info_sections").delete().eq("client_id", s.clientId);
  await s.admin.from("shifts").delete().eq("client_id", s.clientId);
  await s.admin.from("clients").delete().eq("id", s.clientId);
  for (const role of ROLES) await s.admin.auth.admin.deleteUser(s.people[role].id);
  await s.admin.from("organisations").delete().eq("id", s.orgId);
}

async function signIn(page: Page, role: Role, email: string) {
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  if (role === "admin") {
    await expect(page).toHaveURL(/\/mfa\/enroll$/);
    const key = (await page.getByTestId("mfa-manual-key").textContent())?.trim();
    if (!key) throw new Error("no manual key on the enrol page");
    await page.getByLabel("6-digit code").fill(totpCode(key));
    await page.getByRole("button", { name: /verify and continue/i }).click();
  }
  await page.waitForURL((url) => !/^\/(sign-in|mfa)/.test(url.pathname));
}

const infoUrl = (role: Role, clientId: string) =>
  role === "family"
    ? `/family/${clientId}/info`
    : role === "carer"
      ? `/carer/patients/${clientId}/info`
      : `/admin/clients/${clientId}/info`;

async function openAll(browser: Browser, s: Awaited<ReturnType<typeof seed>>) {
  const pages = {} as Record<Role, Page>;
  for (const role of ROLES) {
    const context = await browser.newContext();
    pages[role] = await context.newPage();
    await signIn(pages[role], role, s.people[role].email);
    await pages[role].goto(infoUrl(role, s.clientId));
    await pages[role].waitForLoadState("networkidle");
  }
  return pages;
}

test.describe("Cross-role sync in a real browser", () => {
  test.skip(!enabled, "Needs local Supabase and E2E_DATA_SOURCE=supabase, see the comment above.");

  for (const writer of ROLES) {
    test(`a Habits change saved by ${writer} reaches the other two roles without a reload`, async ({
      browser,
    }) => {
      test.setTimeout(90_000);
      const s = await seed();
      try {
        const pages = await openAll(browser, s);
        for (const role of ROLES) await expect(pages[role].getByText("Tea at 7am.")).toBeVisible();

        const text = `Changed by ${writer}: tea at 6am.`;
        await pages[writer].getByRole("button", { name: "Edit Habits" }).click();
        await pages[writer].getByRole("textbox", { name: "Habits" }).fill(text);
        await pages[writer].getByRole("button", { name: "Save" }).click();
        await expect(pages[writer].getByText(text)).toBeVisible();
        await expect(pages[writer].getByRole("button", { name: "Edit Habits" })).toBeVisible();
        // The screen shows the new text as soon as Save is pressed; wait until it is stored, as a second
        // person would by the time they look.
        await expect
          .poll(async () => {
            const row = await s.admin
              .from("client_info_sections")
              .select("body")
              .eq("client_id", s.clientId)
              .eq("key", "habits")
              .single();
            return row.data?.body;
          })
          .toBe(text);

        for (const reader of ROLES.filter((role) => role !== writer)) {
          const page = pages[reader];
          // Still showing the old text until it moves: nothing pushes to an open page.
          await page.getByRole("link", { name: "Calendar", exact: true }).first().click();
          await page.waitForLoadState("networkidle");
          await page.getByRole("link", { name: "Info", exact: true }).first().click();
          await expect(page.getByText(text), `${reader} reads ${writer}'s change`).toBeVisible();
          await expect(page.getByText("Tea at 7am.")).toHaveCount(0);
        }
      } finally {
        await cleanUp(s);
      }
    });
  }
});
