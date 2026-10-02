import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

import { totpCode } from "../helpers/totp";

import type { Page } from "@playwright/test";

loadEnv({ path: ".env.local" });

// [ADM-08] Writes an organisation, people and shifts to the database it points at, so it only runs
// against a LOCAL Supabase stack with the app started on the same stack and DATA_SOURCE=supabase
// (same setup as tests/e2e/admin-mfa.spec.ts):
//   E2E_PORT=3100 E2E_DATA_SOURCE=supabase NEXT_PUBLIC_SUPABASE_URL=... npx playwright test tests/e2e/admin-carer-assignments.spec.ts
// (the three Supabase variables come from `supabase status -o env`; `.env.local` is the hosted project).
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

/** A fresh organisation with an admin, Aisha (carer) and Margaret (client) — never the seeded ones. */
async function seed() {
  const admin = db();
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const org = await admin
    .from("organisations")
    .insert({ name: `adm-08-${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  async function person(label: string, role: "admin" | "carer", first: string, last: string) {
    const email = `adm-08-${label}-${stamp}@example.test`;
    const user = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (user.error || !user.data.user) throw user.error ?? new Error(label);
    const profile = await admin.from("profiles").insert({
      id: user.data.user.id,
      role,
      organisation_id: org.data!.id,
      first_name: first,
      last_name: last,
    });
    if (profile.error) throw profile.error;
    return { id: user.data.user.id, email };
  }
  const priya = await person("priya", "admin", "Priya", "Nair");
  const aisha = await person("aisha", "carer", "Aisha", "Rahman");
  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: `Doyle-${stamp}`, organisation_id: org.data.id })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");
  const shift = await admin.from("shifts").insert({
    organisation_id: org.data.id,
    carer_id: aisha.id,
    client_id: client.data.id,
    starts_at: new Date(Date.now() + 24 * 3_600_000).toISOString(),
    ends_at: new Date(Date.now() + 28 * 3_600_000).toISOString(),
  });
  if (shift.error) throw shift.error;
  return { orgId: org.data.id, priya, aisha, clientId: client.data.id };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  const admin = db();
  await admin.from("clients").delete().eq("id", s.clientId);
  for (const id of [s.priya.id, s.aisha.id]) await admin.auth.admin.deleteUser(id);
  await admin.from("organisations").delete().eq("id", s.orgId);
}

/** Signs in and completes TOTP enrolment (F0-20), landing on Admin Home. */
async function signInAsAdmin(page: Page, email: string) {
  await page.goto("/sign-in");
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

test.describe("[ADM-08] Carer-client assignments against real data", () => {
  test.skip(!enabled, "Needs local Supabase and E2E_DATA_SOURCE=supabase — see the comment above.");

  test("[ADM-08][AC-01][AC-05] Priya removes Margaret from Aisha on the Staff screen; the row goes and Aisha can no longer read Margaret", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signInAsAdmin(page, s.priya.email);
      await page.goto("/admin/staff");
      await page.getByRole("button", { name: "Edit Aisha Rahman" }).click();

      const list = page.getByRole("region", { name: "Clients for Aisha Rahman" });
      const row = list.getByText(/Margaret Doyle-/);
      await expect(row).toBeVisible();

      await page
        .getByRole("button", { name: /^Remove Margaret Doyle-.* from Aisha Rahman$/ })
        .click();
      const dialog = page.getByRole("dialog", { name: "Remove carer from client?" });
      await expect(dialog).toContainText("Aisha Rahman");
      await dialog.getByRole("button", { name: "Yes, remove" }).click();

      await expect(page.getByRole("status")).toContainText("removed from Aisha Rahman");
      await expect(list.getByText("No clients assigned")).toBeVisible();

      // Persisted: still gone after a reload, and the shift was cancelled, not deleted.
      await page.reload();
      await page.getByRole("button", { name: "Edit Aisha Rahman" }).click();
      await expect(
        page
          .getByRole("region", { name: "Clients for Aisha Rahman" })
          .getByText("No clients assigned"),
      ).toBeVisible();
      const { data: rows, error } = await db()
        .from("shifts")
        .select("cancelled_at")
        .eq("client_id", s.clientId);
      expect(error).toBeNull();
      expect(rows).toHaveLength(1);
      expect(rows![0]!.cancelled_at).not.toBeNull();
    } finally {
      await cleanUp(s);
    }
  });
});
