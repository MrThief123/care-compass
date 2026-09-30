import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

// [CAR-04] Requires a running local Supabase stack and `.env.local` pointing at it (same
// convention as auth.spec.ts). The test seeds its own organisation, carer, client and shifts,
// and removes them afterwards. Do not run it against the hosted project: it writes rows there.
const hasLocalSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const PASSWORD = "correct horse battery staple 1!";
const HOUR = 3_600_000;
const at = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

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
    .insert({ name: `car-04-${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  const email = `car-04-e2e-${stamp}@example.test`;
  const user = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (user.error || !user.data.user) throw user.error ?? new Error("user");
  const profile = await admin.from("profiles").insert({
    id: user.data.user.id,
    role: "carer",
    organisation_id: org.data.id,
    first_name: "Aisha",
    last_name: "Rahman",
  });
  if (profile.error) throw profile.error;

  const clients = await admin
    .from("clients")
    .insert([
      {
        first_name: "Margaret",
        last_name: "Doyle",
        organisation_id: org.data.id,
        suburb: "Preston VIC",
      },
      {
        first_name: "Robert",
        last_name: "Hale",
        organisation_id: org.data.id,
        suburb: "Reservoir VIC",
      },
    ])
    .select("id, first_name");
  if (clients.error || clients.data?.length !== 2) throw clients.error ?? new Error("clients");
  const id = (first: string) => clients.data.find((c) => c.first_name === first)!.id;

  const shifts = await admin.from("shifts").insert([
    {
      client_id: id("Margaret"),
      carer_id: user.data.user.id,
      starts_at: at(-HOUR),
      ends_at: at(HOUR),
    },
    {
      client_id: id("Robert"),
      carer_id: user.data.user.id,
      starts_at: at(24 * HOUR),
      ends_at: at(26 * HOUR),
    },
  ]);
  if (shifts.error) throw shifts.error;
  const sections = await admin.from("client_info_sections").insert([
    { client_id: id("Margaret"), key: "habits", body: "Tea at 7am." },
    { client_id: id("Robert"), key: "habits", body: "Coffee at 8am." },
  ]);
  if (sections.error) throw sections.error;

  return { admin, orgId: org.data.id, userId: user.data.user.id, email, id, ids: clients.data };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  await s.admin.auth.admin.deleteUser(s.userId);
  await s.admin
    .from("clients")
    .delete()
    .in(
      "id",
      s.ids.map((c) => c.id),
    );
  await s.admin.from("organisations").delete().eq("id", s.orgId);
}

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/carer/home");
}

test.describe(() => {
  test.skip(!hasLocalSupabase, "Requires a running local Supabase stack — see README.");

  test("[CAR-04][AC-02] T-02 given an on-shift carer, when she edits Habits and saves, the change is shown and survives a reload", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signIn(page, s.email);
      await page.goto(`/carer/patients/${s.id("Margaret")}/info`);

      await expect(page.getByText("Tea at 7am.")).toBeVisible();
      await page.getByRole("button", { name: "Edit Habits" }).click();
      const box = page.getByRole("textbox", { name: "Habits" });
      await box.fill("Tea at 6am, then a walk.");
      await page.getByRole("button", { name: "Save" }).click();

      await expect(page.getByText("Tea at 6am, then a walk.")).toBeVisible();
      await page.reload();
      await expect(page.getByText("Tea at 6am, then a walk.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Add file" })).toBeVisible();
    } finally {
      await cleanUp(s);
    }
  });

  test("[CAR-04][AC-07][AC-10] given an on-shift carer, when she uploads a 3 MB file it is saved and opens; a file just over 20 MB is refused with the validator's message", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signIn(page, s.email);
      await page.goto(`/carer/patients/${s.id("Margaret")}/info`);
      await page.waitForLoadState("networkidle"); // hydrated, so the file input has its handler
      const chooser = page.locator('input[type="file"]');
      const pdf = (bytes: number) =>
        Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(bytes - 9, 32)]);

      // Above the 1 MB Server Action default (TASK 2), below the 20 MB limit.
      await chooser.setInputFiles({
        name: "Big plan.pdf",
        mimeType: "application/pdf",
        buffer: pdf(3 * 1024 * 1024),
      });
      await expect(page.getByText("Big plan.pdf")).toBeVisible({ timeout: 20_000 });
      await page.reload();
      const tile = page.getByRole("button", { name: "Big plan.pdf" });
      await expect(tile).toBeVisible();

      const popup = page.waitForEvent("popup");
      const signed = page
        .context()
        .waitForEvent("response", (r) => /\/storage\/v1\/object\/sign\//.test(r.url()));
      await tile.click();
      const opened = await popup;
      const response = await signed;
      expect(response.status()).toBe(200);
      // The tab downloads the file, so its body isn't readable there: fetch the same URL.
      const file = await page.request.get(response.url());
      expect(file.status()).toBe(200);
      expect((await file.body()).length).toBe(3 * 1024 * 1024);
      await opened.close();

      // Over 20 MB but inside the 21 MB body limit: the validator answers, not a 413.
      await chooser.setInputFiles({
        name: "Too big.pdf",
        mimeType: "application/pdf",
        buffer: pdf(20 * 1024 * 1024 + 512 * 1024),
      });
      await expect(page.getByText("Files must be 20MB or smaller.")).toBeVisible();
      await expect(page.getByText("Too big.pdf")).toHaveCount(0);
    } finally {
      await cleanUp(s);
    }
  });

  test("[CAR-04][AC-01] given the same carer off shift (Robert), Info is read-only with a view-only notice", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signIn(page, s.email);
      await page.goto(`/carer/patients/${s.id("Robert")}/info`);

      await expect(page.getByText("Coffee at 8am.")).toBeVisible();
      await expect(page.getByRole("note")).toContainText("View only");
      await expect(page.getByRole("button", { name: /^Edit/ })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Add file" })).toHaveCount(0);
    } finally {
      await cleanUp(s);
    }
  });

  test("[CAR-04][AC-04] given a client she has no shift with, opening the URL lands on Patients", async ({
    page,
  }) => {
    const s = await seed();
    try {
      const walter = await s.admin
        .from("clients")
        .insert({ first_name: "Walter", last_name: "Quill", organisation_id: s.orgId })
        .select("id")
        .single();
      if (walter.error || !walter.data) throw walter.error ?? new Error("walter");
      s.ids.push({ id: walter.data.id, first_name: "Walter" });

      await signIn(page, s.email);
      await page.goto(`/carer/patients/${walter.data.id}/info`);

      await expect(page).toHaveURL("/carer/patients");
    } finally {
      await cleanUp(s);
    }
  });
});
