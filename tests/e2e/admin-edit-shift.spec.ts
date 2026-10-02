import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

import { totpCode } from "../helpers/totp";

import type { Page } from "@playwright/test";

loadEnv({ path: ".env.local" });

// [ADM-09] Writes an organisation, people and shifts to the database it points at, so it only runs
// against a LOCAL Supabase stack with the app started on the same stack and DATA_SOURCE=supabase
// (same setup as tests/e2e/admin-mfa.spec.ts):
//   E2E_PORT=3100 E2E_DATA_SOURCE=supabase NEXT_PUBLIC_SUPABASE_URL=... npx playwright test tests/e2e/admin-edit-shift.spec.ts
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

/** A fresh organisation with an admin, Aisha (carer) and Margaret (client), and two future shifts. */
async function seed() {
  const admin = db();
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const org = await admin
    .from("organisations")
    .insert({ name: `adm-09-${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  async function person(label: string, role: "admin" | "carer", first: string, last: string) {
    const email = `adm-09-${label}-${stamp}@example.test`;
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
  // Two shifts on the same future Melbourne day: 07:00-11:00 (to extend) and 14:00-16:00 (to cancel).
  const shifts = await admin
    .from("shifts")
    .insert(
      [
        ["2026-12-14T20:00:00Z", "2026-12-15T00:00:00Z"],
        ["2026-12-15T03:00:00Z", "2026-12-15T05:00:00Z"],
      ].map(([starts_at, ends_at]) => ({
        organisation_id: org.data!.id,
        client_id: client.data!.id,
        carer_id: aisha.id,
        starts_at,
        ends_at,
      })),
    )
    .select("id, starts_at")
    .order("starts_at");
  if (shifts.error || shifts.data?.length !== 2) throw shifts.error ?? new Error("shifts");
  return {
    orgId: org.data.id,
    priya,
    aisha,
    clientId: client.data.id,
    extendId: shifts.data[0]!.id,
    cancelId: shifts.data[1]!.id,
  };
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

test.describe("[ADM-09] Cancel a shift against real data", () => {
  test.skip(!enabled, "Needs local Supabase and E2E_DATA_SOURCE=supabase — see the comment above.");

  async function openDay(page: Page, s: Awaited<ReturnType<typeof seed>>) {
    await page.goto(`/admin/manage?staff=${s.aisha.id}&client=${s.clientId}`);
    const day = page.getByTestId("date-picker-day-2026-12-15");
    for (let i = 0; i < 24 && !(await day.isVisible().catch(() => false)); i += 1) {
      await page.getByRole("button", { name: "Next month" }).click();
    }
    await day.click();
    return day;
  }

  test("[ADM-09][AC-03] cancel the 14:00 shift: it is cancelled in the database, the 07:00 shift is untouched, and both survive a reload", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signInAsAdmin(page, s.priya.email);
      const day = await openDay(page, s);

      const carerShifts = page.getByRole("list", { name: /Aisha Rahman's shifts/ });
      await expect(page.getByRole("button", { name: /^Edit shift/ })).toHaveCount(0);

      await carerShifts.getByRole("button", { name: /^Cancel shift, .*14:00 - 16:00$/ }).click();
      await page
        .getByRole("dialog", { name: "Cancel this shift?" })
        .getByRole("button", { name: "Cancel shift" })
        .click();
      await expect(page.getByRole("status")).toContainText("Shift cancelled");
      await expect(carerShifts.getByText("14:00 - 16:00")).toHaveCount(0);

      const { data: rows, error } = await db()
        .from("shifts")
        .select("id, ends_at, cancelled_at")
        .eq("client_id", s.clientId);
      expect(error).toBeNull();
      const kept = rows!.find((row) => row.id === s.extendId)!;
      const cancelled = rows!.find((row) => row.id === s.cancelId)!;
      expect(new Date(kept.ends_at).toISOString()).toBe("2026-12-15T00:00:00.000Z");
      expect(kept.cancelled_at).toBeNull();
      expect(cancelled.cancelled_at).not.toBeNull();

      await page.reload();
      await openDay(page, s);
      await expect(carerShifts.getByText("07:00 - 11:00")).toBeVisible();
      await expect(carerShifts.getByText("14:00 - 16:00")).toHaveCount(0);
      await expect(day).toHaveAttribute("data-has-items", "true");
    } finally {
      await cleanUp(s);
    }
  });
});
