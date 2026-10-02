import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

import { totpCode } from "../helpers/totp";

import type { Page } from "@playwright/test";

loadEnv({ path: ".env.local" });

// [ADM-08][FD-05][FD-07] Writes an organisation, people and shifts to the database it points at, so it only runs
// against a LOCAL Supabase stack with the app started on the same stack and DATA_SOURCE=supabase
// (same setup as tests/e2e/admin-mfa.spec.ts):
//   E2E_PORT=3100 E2E_DATA_SOURCE=supabase NEXT_PUBLIC_SUPABASE_URL=... npx playwright test tests/e2e/admin-staff-panel.spec.ts
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

/** A fresh organisation with an admin and one active carer who has a client, never the seeded ones. */
async function seed() {
  const admin = db();
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const org = await admin
    .from("organisations")
    .insert({ name: `adm-08p-${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  async function person(label: string, role: "admin" | "carer", first: string, last: string) {
    const email = `adm-08p-${label}-${stamp}@example.test`;
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
      email,
      job_title: "Registered Nurse",
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
  return {
    stamp,
    orgId: org.data.id,
    priya,
    aisha,
    clientId: client.data.id,
    invitedEmail: `helen-${stamp}@example.test`,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  const admin = db();
  const invited = await admin
    .from("profiles")
    .select("id")
    .eq("email", s.invitedEmail)
    .maybeSingle();
  await admin.from("shifts").delete().eq("client_id", s.clientId);
  await admin.from("clients").delete().eq("id", s.clientId);
  for (const id of [s.priya.id, s.aisha.id, invited.data?.id].filter(Boolean) as string[]) {
    await admin.auth.admin.deleteUser(id);
  }
  await admin.from("organisations").delete().eq("id", s.orgId);
}

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

test.describe("[ADM-08] Staff screen against real data", () => {
  test.skip(!enabled, "Needs local Supabase and E2E_DATA_SOURCE=supabase, see the comment above.");

  test("[ADM-08][FD-05] the panel is closed until a name or Add Staff is pressed, and Close clears it", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signInAsAdmin(page, s.priya.email);
      await page.goto("/admin/staff");
      await expect(page.getByLabel("First name")).toHaveCount(0);
      await page.getByRole("button", { name: "Edit Aisha Rahman" }).click();
      await expect(page.getByLabel("First name")).toHaveValue("Aisha");
      await expect(
        page.getByRole("region", { name: "Clients for Aisha Rahman" }).getByText(/Margaret Doyle-/),
      ).toBeVisible();
      await page.getByRole("button", { name: "Close" }).click();
      await expect(page.getByLabel("First name")).toHaveCount(0);
      await page.getByRole("button", { name: "Add Staff" }).click();
      await expect(page.getByLabel("First name")).toHaveValue("");
    } finally {
      await cleanUp(s);
    }
  });

  test("[ADM-08][FD-07] an invited carer is Pending, stays Pending after a reload, and stops being Pending once they confirm", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signInAsAdmin(page, s.priya.email);
      await page.goto("/admin/staff");
      await page.getByRole("button", { name: "Add Staff" }).click();
      await page.getByLabel("First name").fill("Helen");
      await page.getByLabel("Last name").fill("Brown");
      await page.getByLabel("Phone").fill("0412 345 678");
      await page.getByLabel("Email").fill(s.invitedEmail);
      await page.getByLabel("Role").selectOption("Support Worker");
      await page.getByRole("button", { name: "Save" }).click();
      const row = page.getByRole("row", { name: /Helen Brown/ });
      await expect(row.getByText("Pending")).toBeVisible();

      await page.reload();
      await expect(
        page.getByRole("row", { name: /Helen Brown/ }).getByText("Pending"),
      ).toBeVisible();
      await expect(
        page.getByRole("row", { name: /Aisha Rahman/ }).getByText("Pending"),
      ).toHaveCount(0);

      // The database agrees: the account exists, unconfirmed, and the profile is in this organisation.
      const profile = await db()
        .from("profiles")
        .select("id, organisation_id, role")
        .eq("email", s.invitedEmail)
        .single();
      expect(profile.error).toBeNull();
      expect(profile.data!.organisation_id).toBe(s.orgId);
      expect(profile.data!.role).toBe("carer");
      const account = await db().auth.admin.getUserById(profile.data!.id);
      expect(account.data.user?.email_confirmed_at ?? null).toBeNull();

      // Manage reads the same carers: Helen is there to pick before she has signed in, and a shift
      // can be started for her with Margaret.
      await page.goto(`/admin/manage?staff=${profile.data!.id}&client=${s.clientId}`);
      await expect(page.getByText("Helen Brown").first()).toBeVisible();
      await expect(page.getByText(/Helen Brown → Margaret Doyle-/)).toBeVisible();

      // Helen follows the invite link: Pending goes away.
      await page.goto("/admin/staff");
      const confirmed = await db().auth.admin.updateUserById(profile.data!.id, {
        email_confirm: true,
      });
      expect(confirmed.error).toBeNull();
      await page.reload();
      await expect(page.getByRole("row", { name: /Helen Brown/ })).toBeVisible();
      await expect(page.getByRole("row", { name: /Helen Brown/ }).getByText("Pending")).toHaveCount(
        0,
      );
    } finally {
      await cleanUp(s);
    }
  });
});
