import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

import type { Page } from "@playwright/test";

loadEnv({ path: ".env.local" });

// The tests that create accounts need a local Supabase stack (`supabase start`, migrations applied)
// because they need this feature's migration (`register_account`); against a hosted project that
// lacks it they skip, as the integration tests do. If `.env.local` points at a hosted project,
// override the three variables from `npx supabase status -o env` for the build and the run. The
// page-only tests below write nothing and always run.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function unique(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function deleteAccount(email: string, clientLastName?: string) {
  const admin = adminClient();
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = data?.users.find((candidate) => candidate.email === email);
  if (user) await admin.auth.admin.deleteUser(user.id);
  if (clientLastName) await admin.from("clients").delete().eq("last_name", clientLastName);
}

async function fillFamilySignUp(page: Page, email: string, clientLastName: string) {
  await page.getByRole("radio", { name: "Family member" }).check();
  await page.getByLabel("Your first name").fill("Grace");
  await page.getByLabel("Your last name").fill("Smith");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByLabel("Their first name").fill("Harold");
  await page.getByLabel("Their last name").fill(clientLastName);
}

test.describe(() => {
  test.skip(
    !hasLocalSupabase,
    "Creates accounts and needs this feature's migration: local Supabase stack only — see README.",
  );

  test("[F0-17][AC-01] a family sign-up lands on /family/<Harold id>/home, with Harold unlinked to an organisation and Grace as his family member", async ({
    page,
  }) => {
    const email = `f0-17-e2e-${unique("family")}@example.test`;
    const clientLastName = unique("Smith");
    try {
      await page.goto("/sign-up");
      await fillFamilySignUp(page, email, clientLastName);
      await page.getByRole("button", { name: "Create an account" }).click();

      await expect(page).toHaveURL(/\/family\/[0-9a-f-]{36}\/home$/);
      const clientIdInUrl = page.url().match(/\/family\/([0-9a-f-]{36})\/home$/)![1];

      const admin = adminClient();
      const { data: client } = await admin
        .from("clients")
        .select("id, first_name, organisation_id")
        .eq("last_name", clientLastName)
        .single();
      expect(client).toMatchObject({
        id: clientIdInUrl,
        first_name: "Harold",
        organisation_id: null,
      });

      const { data: links } = await admin
        .from("client_family_members")
        .select("profile_id")
        .eq("client_id", client!.id);
      expect(links).toHaveLength(1);
      const { data: profile } = await admin
        .from("profiles")
        .select("role, organisation_id, first_name")
        .eq("id", links![0]!.profile_id)
        .single();
      expect(profile).toEqual({ role: "family", organisation_id: null, first_name: "Grace" });
    } finally {
      await deleteAccount(email, clientLastName);
    }
  });

  test("[F0-17][PRD] a signed-in user who opens /sign-up is sent to their own home", async ({
    page,
  }) => {
    const email = `f0-17-e2e-${unique("redirect")}@example.test`;
    const clientLastName = unique("Smith");
    try {
      await page.goto("/sign-up");
      await fillFamilySignUp(page, email, clientLastName);
      await page.getByRole("button", { name: "Create an account" }).click();
      await expect(page).toHaveURL(/\/family\/[0-9a-f-]{36}\/home$/);
      const home = new URL(page.url()).pathname;

      await page.goto("/sign-up");

      await expect(page).toHaveURL(home);
    } finally {
      await deleteAccount(email, clientLastName);
    }
  });
});

test.describe("[F0-17][AC-08] /sign-up page", () => {
  test("[F0-17][AC-08] renders in the auth layout with the same card and button as /sign-in", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    const signInButton = page.getByRole("button", { name: "Sign in" });
    const signInStyle = await signInButton.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        radius: s.borderRadius,
        height: el.getBoundingClientRect().height,
      };
    });
    const signInCard = await page.getByRole("heading", { name: "Sign in" }).evaluate((el) => {
      const card = el.closest("div[class*='rounded']") ?? el.parentElement!.parentElement!;
      const s = getComputedStyle(card);
      return { bg: s.backgroundColor, radius: s.borderRadius, border: s.borderTopWidth };
    });

    await page.goto("/sign-up");

    await expect(page.getByRole("heading", { name: "Create an account", level: 1 })).toBeVisible();
    // Auth layout: no app shell, no rail.
    await expect(page.getByRole("navigation")).toHaveCount(0);

    const submit = page.getByRole("button", { name: "Create an account" });
    const submitStyle = await submit.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        radius: s.borderRadius,
        height: el.getBoundingClientRect().height,
      };
    });
    expect(submitStyle).toEqual(signInStyle);
    expect(submitStyle.height).toBeGreaterThanOrEqual(44);

    const card = await page
      .getByRole("heading", { name: "Create an account", level: 1 })
      .evaluate((el) => {
        const cardEl = el.closest("div[class*='rounded']") ?? el.parentElement!.parentElement!;
        const s = getComputedStyle(cardEl);
        return { bg: s.backgroundColor, radius: s.borderRadius, border: s.borderTopWidth };
      });
    expect(card).toEqual(signInCard);
  });

  test("[F0-17][AC-08] shows client name fields only for 'Family member' and Organisation name only for 'Organisation'", async ({
    page,
  }) => {
    await page.goto("/sign-up");

    await page.getByRole("radio", { name: "Family member" }).check();
    await expect(page.getByLabel("Their first name")).toBeVisible();
    await expect(page.getByLabel("Their last name")).toBeVisible();
    await expect(page.getByLabel("Organisation name")).toHaveCount(0);

    await page.getByRole("radio", { name: "Organisation" }).check();
    await expect(page.getByLabel("Organisation name")).toBeVisible();
    await expect(page.getByLabel("Their first name")).toHaveCount(0);
    await expect(page.getByLabel("Their last name")).toHaveCount(0);

    // Shared fields are always there.
    for (const label of ["Your first name", "Your last name", "Email", "Confirm password"]) {
      await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  });

  test("[F0-17][AC-08] offers no carer option and shows the carer help text", async ({ page }) => {
    await page.goto("/sign-up");

    await expect(page.getByRole("radio")).toHaveCount(2);
    await expect(page.getByRole("radio", { name: /carer/i })).toHaveCount(0);
    await expect(page.getByText("Carers: ask your organisation to invite you.")).toBeVisible();
  });

  test("[F0-17][AC-08] sign-in and sign-up link to each other", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page).toHaveURL("/sign-up");

    await page.getByRole("link", { name: "Already have an account? Sign in" }).click();
    await expect(page).toHaveURL("/sign-in");
  });

  test("[F0-17][AC-03] submitting with a missing field and short, mismatched passwords shows field errors and stays on /sign-up", async ({
    page,
  }) => {
    await page.goto("/sign-up");
    await page.getByRole("radio", { name: "Family member" }).check();
    await page.getByLabel("Email").fill("someone@example.test");
    await page.getByLabel("Password", { exact: true }).fill("abc");
    await page.getByLabel("Confirm password").fill("abd");
    await page.getByRole("button", { name: "Create an account" }).click();

    await expect(page).toHaveURL("/sign-up");
    await expect(page.getByText("Your first name is required.")).toBeVisible();
    await expect(page.getByText(/at least 6 characters/i)).toBeVisible();
    await expect(page.getByText("Passwords do not match.")).toBeVisible();
  });
});
