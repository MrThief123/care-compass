import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

import { waitForEmailLink } from "../helpers/mailpit";
import { totpCode } from "../helpers/totp";

loadEnv({ path: ".env.local" });

// [F0-24] Real emails, read from the LOCAL Mailpit. Local Supabase stack only; the app must run on
// the same stack with DATA_SOURCE=supabase (same setup as tests/e2e/admin-staff-panel.spec.ts):
//   E2E_PORT=3100 E2E_DATA_SOURCE=supabase NEXT_PUBLIC_SUPABASE_URL=... npx playwright test tests/e2e/auth-emails.spec.ts
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const enabled =
  isLocalUrl &&
  process.env.E2E_DATA_SOURCE === "supabase" &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const NEW_PASSWORD = "a brand new password 2!";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

test.describe("[F0-24] emailed links work end to end", () => {
  test.skip(!enabled, "Needs local Supabase and E2E_DATA_SOURCE=supabase, see the comment above.");

  test("[F0-24][AC-01][AC-02] T-01 reset: emailed link sets a new password; the old one is refused; the link works once", async ({
    page,
    baseURL,
  }) => {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `f0-24-reset-${stamp}@example.test`;
    const created = await db().auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (created.error || !created.data.user) throw created.error ?? new Error("createUser");
    const userId = created.data.user.id;
    try {
      const since = Date.now();
      await page.goto("/forgot-password");
      await page.getByLabel("Email").fill(email);
      await page.getByRole("button", { name: /send|reset/i }).click();

      const { link } = await waitForEmailLink(email, { since });
      const appLink = new URL(new URL(link).pathname + new URL(link).search, baseURL).toString();
      await page.goto(appLink);
      await expect(page).toHaveURL(/\/reset-password$/);
      await page.getByLabel("New password").fill(NEW_PASSWORD);
      await page.getByRole("button", { name: "Save password" }).click();
      await expect(page).not.toHaveURL(/\/reset-password/);

      // The old password no longer signs in; the new one does.
      const anon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } },
      );
      expect(
        (await anon.auth.signInWithPassword({ email, password: PASSWORD })).error,
      ).not.toBeNull();
      expect(
        (await anon.auth.signInWithPassword({ email, password: NEW_PASSWORD })).error,
      ).toBeNull();

      // The same link a second time: expired-link path, no session.
      await page.context().clearCookies();
      await page.goto(appLink);
      await expect(page).toHaveURL(/\/sign-in\?reason=reset-link-expired/);
      await page.goto("/reset-password");
      await page.getByLabel("New password").fill("another password 3!");
      await page.getByRole("button", { name: "Save password" }).click();
      await expect(page.getByText(/expired|request a new/i)).toBeVisible();
    } finally {
      await db().auth.admin.deleteUser(userId);
    }
  });

  test("[F0-24][AC-03] T-03 invite: an admin invites a carer, the carer follows the email, sets a password and lands on /carer/home", async ({
    page,
    browser,
    baseURL,
  }) => {
    const admin = db();
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const org = await admin
      .from("organisations")
      .insert({ name: `f0-24-${stamp}` })
      .select("id")
      .single();
    if (org.error || !org.data) throw org.error ?? new Error("org");
    const adminEmail = `f0-24-admin-${stamp}@example.test`;
    const carerEmail = `f0-24-carer-${stamp}@example.test`;
    const adminUser = await admin.auth.admin.createUser({
      email: adminEmail,
      password: PASSWORD,
      email_confirm: true,
    });
    if (adminUser.error || !adminUser.data.user) throw adminUser.error ?? new Error("admin");
    await admin.from("profiles").insert({
      id: adminUser.data.user.id,
      role: "admin",
      organisation_id: org.data.id,
      first_name: "Pat",
      last_name: "Admin",
      email: adminEmail,
    });

    try {
      await page.goto("/sign-in");
      await page.getByLabel("Email").fill(adminEmail);
      await page.getByLabel("Password").fill(PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page).toHaveURL(/\/mfa\/enroll$/);
      const key = (await page.getByTestId("mfa-manual-key").textContent())?.trim();
      if (!key) throw new Error("no manual key on the enrol page");
      await page.getByLabel("6-digit code").fill(totpCode(key));
      await page.getByRole("button", { name: /verify and continue/i }).click();
      await expect(page).toHaveURL(/\/admin\/home$/);

      const since = Date.now();
      await page.goto("/admin/staff");
      await page.getByRole("button", { name: "Add Staff" }).click();
      await page.getByLabel("First name").fill("Nia");
      await page.getByLabel("Last name").fill("Carer");
      await page.getByLabel("Phone").fill("0412 345 678");
      await page.getByLabel("Email").fill(carerEmail);
      await page.getByRole("button", { name: "Save" }).click();
      await expect(page.getByRole("status")).toContainText("Nia Carer invited");

      // The carer, in a clean browser, follows the email.
      const { link } = await waitForEmailLink(carerEmail, { since });
      const carerContext = await browser.newContext({ baseURL });
      const carerPage = await carerContext.newPage();
      await carerPage.goto(
        new URL(new URL(link).pathname + new URL(link).search, baseURL).toString(),
      );
      await expect(carerPage).toHaveURL(/\/set-password$/);
      await expect(carerPage.getByRole("heading", { name: "Set your password" })).toBeVisible();
      await carerPage.getByLabel("New password").fill(NEW_PASSWORD);
      await carerPage.getByRole("button", { name: "Save password" }).click();
      await expect(carerPage).toHaveURL(/\/carer\/home$/);
      await carerContext.close();

      // Resend is for carers who have not signed in; this one now has, so it is gone.
      await page.reload();
      await page.getByRole("button", { name: "Edit Nia Carer" }).click();
      await expect(page.getByRole("button", { name: "Resend invite" })).toHaveCount(0);
    } finally {
      const carer = await admin.from("profiles").select("id").eq("email", carerEmail).maybeSingle();
      for (const id of [adminUser.data.user.id, carer.data?.id].filter(Boolean) as string[]) {
        await admin.auth.admin.deleteUser(id);
      }
      await admin.from("organisations").delete().eq("id", org.data.id);
    }
  });
});
