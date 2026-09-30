import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

import { freshTotpCode, totpCode } from "../helpers/totp";

import type { Page } from "@playwright/test";

loadEnv({ path: ".env.local" });

// F0-20. Creates users and an organisation in the database it points at, so it only runs against a
// LOCAL Supabase stack, with the app started on the same stack and DATA_SOURCE=supabase:
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 ... DATA_SOURCE=supabase npx next dev -p 3100
//   E2E_PORT=3100 NEXT_PUBLIC_SUPABASE_URL=... npx playwright test tests/e2e/admin-mfa.spec.ts
// (the three Supabase variables come from `supabase status -o env`; `.env.local` is the hosted project).
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const runsAgainstSupabase = process.env.E2E_DATA_SOURCE === "supabase";
const enabled =
  isLocalUrl &&
  runsAgainstSupabase &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/** A fresh admin with their own organisation — never the seeded Priya. */
async function createTestAdmin() {
  const db = adminClient();
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `f0-20-e2e-admin-${suffix}@example.test`;
  const { data: org, error: orgError } = await db
    .from("organisations")
    .insert({ name: `F0-20 E2E Org ${suffix}` })
    .select("id")
    .single();
  if (orgError || !org) throw orgError ?? new Error("failed to create the e2e organisation");
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("failed to create the e2e admin");
  const { error: profileError } = await db.from("profiles").insert({
    id: data.user.id,
    role: "admin",
    organisation_id: org.id,
    first_name: "Test",
    last_name: "Admin",
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, organisationId: org.id, email };
}

async function cleanUp(admin: { userId: string; organisationId: string }) {
  const db = adminClient();
  await db.auth.admin.deleteUser(admin.userId);
  await db.from("organisations").delete().eq("id", admin.organisationId);
}

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
}

/** Waits for the enrol page's QR and returns the on-page manual key. */
async function readEnrolment(page: Page): Promise<string> {
  const qr = page.getByRole("img", { name: /scan with your authenticator app/i });
  await expect(qr).toBeVisible();
  // `src` being set is not enough: the browser has to have decoded the image.
  await expect
    .poll(() => qr.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  const key = (await page.getByTestId("mfa-manual-key").textContent())?.trim();
  if (!key) throw new Error("no manual key on the enrol page");
  return key;
}

test.describe("[F0-20] admin TOTP MFA in a real browser", () => {
  test.skip(!enabled, "Needs local Supabase and E2E_DATA_SOURCE=supabase — see the comment above.");

  test("[F0-20][AC-01][AC-04] the QR loads and the key works after repeated refreshes", async ({
    page,
  }) => {
    const admin = await createTestAdmin();
    try {
      await signIn(page, admin.email);
      await expect(page).toHaveURL(/\/mfa\/enroll$/);

      let key = await readEnrolment(page);
      for (let i = 0; i < 4; i += 1) {
        await page.reload();
        key = await readEnrolment(page);
      }
      await expect(page.getByText("Couldn't start MFA enrollment")).toHaveCount(0);

      await page.getByLabel("6-digit code").fill(totpCode(key));
      await page.getByRole("button", { name: /verify and continue/i }).click();
      await expect(page).toHaveURL(/\/admin\/home$/);
    } finally {
      await cleanUp(admin);
    }
  });

  test("[F0-20][AC-07] enrol, land home, sign out, sign in, verify, land home", async ({
    page,
  }) => {
    const admin = await createTestAdmin();
    try {
      await signIn(page, admin.email);
      await expect(page).toHaveURL(/\/mfa\/enroll$/);
      const key = await readEnrolment(page);
      const enrolCode = totpCode(key);
      await page.getByLabel("6-digit code").fill(enrolCode);
      await page.getByRole("button", { name: /verify and continue/i }).click();
      await expect(page).toHaveURL(/\/admin\/home$/);

      await page.getByRole("button", { name: "Sign out" }).click();
      await expect(page).toHaveURL(/\/sign-in$/);

      await signIn(page, admin.email);
      await expect(page).toHaveURL(/\/mfa\/verify$/);
      await page.getByLabel("6-digit code").fill(await freshTotpCode(key, enrolCode));
      await page.getByRole("button", { name: "Verify" }).click();
      await expect(page).toHaveURL(/\/admin\/home$/);
    } finally {
      await cleanUp(admin);
    }
  });

  test("[F0-20][AC-05] a wrong code shows the error and clears the field; a retry works", async ({
    page,
  }) => {
    const admin = await createTestAdmin();
    try {
      await signIn(page, admin.email);
      const key = await readEnrolment(page);
      const field = page.getByLabel("6-digit code");
      const right = totpCode(key);
      const wrong = right === "000000" ? "111111" : "000000";

      await field.fill(wrong);
      await page.getByRole("button", { name: /verify and continue/i }).click();
      await expect(page.getByRole("alert")).toContainText("isn't right");
      await expect(field).toHaveValue("");
      await expect(field).toBeFocused();

      await field.fill(right);
      await page.getByRole("button", { name: /verify and continue/i }).click();
      await expect(page).toHaveURL(/\/admin\/home$/);
    } finally {
      await cleanUp(admin);
    }
  });
});
