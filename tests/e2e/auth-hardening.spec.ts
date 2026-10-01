import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

import type { Page } from "@playwright/test";

loadEnv({ path: ".env.local" });

// F0-21 Auth security audit, e2e half. Creates users in the database it points at, so it only runs
// against a LOCAL Supabase stack, with a production build of the app on the same stack:
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
//   SUPABASE_SERVICE_ROLE_KEY=... npx next build
//   E2E_PORT=3121 E2E_DATA_SOURCE=supabase <same three variables> \
//   npx playwright test tests/e2e/auth-hardening.spec.ts
// (`.env.local` is the hosted project, so a run without the overrides skips.)
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
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

const tag = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function createUser(role: "family" | "carer", organisationId: string | null) {
  const email = `f0-21-e2e-${role}-${tag()}@example.test`;
  const { data, error } = await db().auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  const { error: profileError } = await db()
    .from("profiles")
    .insert({
      id: data.user.id,
      role,
      organisation_id: organisationId,
      first_name: "E2e",
      last_name: role,
    });
  if (profileError) throw profileError;
  return { id: data.user.id, email };
}

/** Two families, each with their own client, and a carer of another organisation. */
async function seed() {
  const t = tag();
  const { data: org } = await db()
    .from("organisations")
    .insert({ name: `F0-21 E2E Org ${t}` })
    .select("id")
    .single();
  const familyA = await createUser("family", null);
  const familyB = await createUser("family", null);
  const carer = await createUser("carer", org!.id);
  const { data: clients } = await db()
    .from("clients")
    .insert([
      { first_name: "Annabel", last_name: `Secret ${t}` },
      { first_name: "Bertie", last_name: `Own ${t}` },
    ])
    .select("id, first_name");
  const clientA = clients!.find((c) => c.first_name === "Annabel")!.id;
  const clientB = clients!.find((c) => c.first_name === "Bertie")!.id;
  await db()
    .from("client_family_members")
    .insert([
      { client_id: clientA, profile_id: familyA.id },
      { client_id: clientB, profile_id: familyB.id },
    ]);
  return { familyA, familyB, carer, clientA, clientB, lastNameA: `Secret ${t}` };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const u of [s.familyA, s.familyB, s.carer]) await db().auth.admin.deleteUser(u.id);
}

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
}

test.describe("[F0-21] auth hardening", () => {
  test.skip(!enabled, "needs a local Supabase stack and E2E_DATA_SOURCE=supabase");

  test.describe("without JavaScript (a submit before hydration)", () => {
    test.use({ javaScriptEnabled: false });

    test("[F0-21][AC-05] T-06 the sign-in form never puts the email or password in the URL", async ({
      page,
    }) => {
      const email = `nobody-${tag()}@example.test`;
      const password = `pw-${tag()}`;
      await page.goto("/sign-in");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      const request = page.waitForRequest(
        (r) => r.isNavigationRequest() && r.frame() === page.mainFrame(),
      );
      await page.getByLabel("Password").press("Enter");
      const sent = await request;

      expect(sent.method()).toBe("POST");
      for (const url of [sent.url(), page.url()]) {
        expect(url).not.toContain(encodeURIComponent(email));
        expect(url).not.toContain(email);
        expect(url).not.toContain(password);
        expect(new URL(url).search).toBe("");
      }
    });

    test("[F0-21][AC-05] T-06 the forgot-password form never puts the email in the URL", async ({
      page,
    }) => {
      const email = `nobody-${tag()}@example.test`;
      await page.goto("/forgot-password");
      await page.getByLabel("Email").fill(email);
      const request = page.waitForRequest(
        (r) => r.isNavigationRequest() && r.frame() === page.mainFrame(),
      );
      await page.getByLabel("Email").press("Enter");
      const sent = await request;
      expect(sent.method()).toBe("POST");
      expect(sent.url()).not.toContain(encodeURIComponent(email));
      expect(new URL(sent.url()).search).toBe("");
    });
  });

  test("[F0-21][AC-02] T-02 the session cookies the browser holds are HttpOnly and SameSite=Lax", async ({
    page,
    context,
  }) => {
    const s = await seed();
    try {
      await signIn(page, s.familyB.email);
      const session = (await context.cookies()).filter((c) => c.name.startsWith("sb-"));
      expect(session.length).toBeGreaterThan(0);
      for (const cookie of session) {
        expect(cookie.httpOnly, cookie.name).toBe(true);
        expect(cookie.sameSite, cookie.name).toBe("Lax");
        // Loopback http build: Secure is deliberately off here, on in a real deployment (unit T-02).
        expect(cookie.secure, cookie.name).toBe(false);
      }
      // No script on the page can read the session.
      expect(await page.evaluate(() => document.cookie)).not.toMatch(/sb-[^=]*auth-token/);
    } finally {
      await cleanUp(s);
    }
  });

  test("[F0-21][AC-03] T-04 another family's /family/<clientId> pages and /admin are refused", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signIn(page, s.familyB.email);
      for (const path of ["home", "info", "budget", "calendar", "tasks", "settings"]) {
        await page.goto(`/family/${s.clientA}/${path}`);
        await expect(page).toHaveURL(new RegExp(`/family/${s.clientB}/home$`));
        await expect(page.getByText(s.lastNameA)).toHaveCount(0);
      }
      for (const path of [
        "/admin/home",
        "/admin/clients",
        "/admin/staff",
        "/admin/manage",
        "/admin/settings",
      ]) {
        await page.goto(path);
        await expect(page).toHaveURL(new RegExp(`/family/${s.clientB}/home$`));
      }
    } finally {
      await cleanUp(s);
    }
  });

  test("[F0-21][AC-03] T-04 a carer cannot open a family's client pages or /admin", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signIn(page, s.carer.email);
      await page.goto(`/family/${s.clientA}/home`);
      await expect(page).toHaveURL(/\/carer\/home$/);
      await page.goto("/admin/clients");
      await expect(page).toHaveURL(/\/carer\/home$/);
      await expect(page.getByText(s.lastNameA)).toHaveCount(0);
    } finally {
      await cleanUp(s);
    }
  });
});
