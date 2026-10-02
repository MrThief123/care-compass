import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

import { melbourneDateKey } from "../../src/lib/dates/melbourne-time";

loadEnv({ path: ".env.local" });

// [CAR-07] Requires a running local Supabase stack and `.env.local` pointing at it (same
// convention as auth.spec.ts). The test seeds its own organisation, carer, client and shifts,
// and removes them afterwards. Do not run it against the hosted project: it writes rows there.
const hasLocalSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const PASSWORD = "correct horse battery staple 1!";
const HOUR = 3_600_000;

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

const at = (offsetMs: number) =>
  new Date(Math.floor((Date.now() + offsetMs) / 1000) * 1000).toISOString();

/** Aisha (carer) with a shift in progress with Margaret; Helen (family) of Margaret; one task, today. */
async function seed() {
  const admin = adminClient();
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const org = await admin
    .from("organisations")
    .insert({ name: `car-07-${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  async function person(label: string, role: "carer" | "family", first: string, last: string) {
    const email = `car-07-${label}-${stamp}@example.test`;
    const user = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (user.error || !user.data.user) throw user.error ?? new Error(label);
    const profile = await admin.from("profiles").insert({
      id: user.data.user.id,
      role,
      organisation_id: role === "carer" ? org.data!.id : null,
      first_name: first,
      last_name: last,
    });
    if (profile.error) throw profile.error;
    return { id: user.data.user.id, email };
  }
  const aisha = await person("aisha", "carer", "Aisha", "Rahman");
  const helen = await person("helen", "family", "Helen", "Doyle");

  const client = await admin
    .from("clients")
    .insert({
      first_name: "Margaret",
      last_name: `Doyle-${stamp}`,
      organisation_id: org.data.id,
      suburb: "Preston VIC",
    })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");
  const family = await admin.from("client_family_members").insert({
    client_id: client.data.id,
    profile_id: helen.id,
    relationship_label: "Daughter",
  });
  if (family.error) throw family.error;
  const event = await admin.from("care_events").insert({
    client_id: client.data.id,
    title: "Physiotherapy",
    starts_at: at(-10 * 60_000),
  });
  if (event.error) throw event.error;
  const shift = await admin.from("shifts").insert({
    client_id: client.data.id,
    carer_id: aisha.id,
    starts_at: at(-HOUR),
    ends_at: at(HOUR),
  });
  if (shift.error) throw shift.error;

  return { admin, orgId: org.data.id, aisha, helen, clientId: client.data.id };
}

// Completions are append-only and restrict deleting their client, so Margaret is left behind (unique name).
async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.aisha, s.helen]) await s.admin.auth.admin.deleteUser(user.id);
  await s.admin.from("shifts").delete().eq("client_id", s.clientId);
  await s.admin.from("clients").delete().eq("id", s.clientId);
  await s.admin.from("organisations").delete().eq("id", s.orgId);
}

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
}

test.describe(() => {
  test.skip(!hasLocalSupabase, "Requires a running local Supabase stack — see README.");

  test("[CAR-07][AC-01] T-01 given Aisha on shift with Margaret, when she adds an event from Margaret's Calendar, Margaret's family sees it on their Calendar", async ({
    browser,
  }) => {
    const s = await seed();
    const carerContext = await browser.newContext();
    const familyContext = await browser.newContext();
    try {
      const carer = await carerContext.newPage();
      await signIn(carer, s.aisha.email);
      await carer.goto(`/carer/patients/${s.clientId}/calendar`);
      await carer.waitForLoadState("networkidle"); // hydrated, so the link and form have their handlers

      await carer.getByRole("link", { name: "Enter event" }).click();
      await carer.waitForURL(new RegExp(`/carer/patients/${s.clientId}/events/new`));
      await carer.waitForLoadState("networkidle");
      await carer
        .getByTestId(`date-picker-day-${melbourneDateKey(new Date().toISOString())}`)
        .click();
      await carer.getByLabel("Title").fill("Garden walk");
      await carer.getByRole("button", { name: "Save event" }).click();

      // Back on the carer's own Calendar, never in the family area.
      await carer.waitForURL(new RegExp(`/carer/patients/${s.clientId}/calendar`));
      expect(await carer.locator('a[href^="/family/"]').count()).toBe(0);

      const family = await familyContext.newPage();
      await signIn(family, s.helen.email);
      await family.goto(`/family/${s.clientId}/calendar`);
      await expect(family.getByText("Garden walk").first()).toBeVisible();
    } finally {
      await carerContext.close();
      await familyContext.close();
      await cleanUp(s);
    }
  });

  test("[CAR-07][AC-06] T-02 given Aisha's shift ends while the Add event form is open, when she saves, the form stays with a shift-ended message and nothing is created", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signIn(page, s.aisha.email);
      await page.goto(`/carer/patients/${s.clientId}/events/new`);
      await page.waitForLoadState("networkidle");
      await page
        .getByTestId(`date-picker-day-${melbourneDateKey(new Date().toISOString())}`)
        .click();
      await page.getByLabel("Title").fill("Too late");

      // The shift ends (an admin shortens it) while the form is open.
      const ended = await s.admin
        .from("shifts")
        .update({ starts_at: at(-2 * HOUR), ends_at: at(-60_000) })
        .eq("client_id", s.clientId);
      expect(ended.error).toBeNull();
      await page.getByRole("button", { name: "Save event" }).click();

      await expect(
        page.getByText("Your shift with Margaret has ended, so this event wasn't saved."),
      ).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`/events/new`));
      await expect(page.getByLabel("Title")).toHaveValue("Too late");
      const rows = await s.admin.from("care_events").select("id").eq("title", "Too late");
      expect(rows.data).toHaveLength(0);
    } finally {
      await cleanUp(s);
    }
  });

  test("[CAR-07][AC-05] T-05 given Aisha on shift, when she opens Physiotherapy's Task detail and edits it, Margaret's family sees the new title", async ({
    browser,
  }) => {
    const s = await seed();
    const carerContext = await browser.newContext();
    const familyContext = await browser.newContext();
    try {
      const carer = await carerContext.newPage();
      await signIn(carer, s.aisha.email);
      await carer.goto(`/carer/patients/${s.clientId}/tasks`);
      await carer.waitForLoadState("networkidle");
      await carer
        .getByRole("link", { name: /Physiotherapy/ })
        .first()
        .click();
      await carer.getByRole("link", { name: "Edit event" }).click();
      await carer.waitForURL(new RegExp(`/carer/patients/${s.clientId}/events/.+/edit`));
      await carer.waitForLoadState("networkidle");

      await carer.getByLabel("Title").fill("Physiotherapy (extra)");
      await carer.getByRole("button", { name: "Save event" }).click();
      await carer.waitForURL(new RegExp(`/carer/patients/${s.clientId}/tasks/`));
      expect(await carer.locator('a[href^="/family/"]').count()).toBe(0);

      const family = await familyContext.newPage();
      await signIn(family, s.helen.email);
      await family.goto(`/family/${s.clientId}/calendar`);
      await expect(family.getByText("Physiotherapy (extra)").first()).toBeVisible();
    } finally {
      await carerContext.close();
      await familyContext.close();
      await cleanUp(s);
    }
  });

  test("[CAR-07][AC-03][AC-07] T-03 given Aisha's shift has not started, there is no entry point and the Add event route sends her back to the Calendar", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await s.admin
        .from("shifts")
        .update({ starts_at: at(3 * HOUR), ends_at: at(5 * HOUR) })
        .eq("client_id", s.clientId);
      await signIn(page, s.aisha.email);

      await page.goto(`/carer/patients/${s.clientId}/calendar`);
      await expect(page.getByRole("note")).toContainText("View only");
      await expect(page.getByRole("link", { name: /enter event|add event/i })).toHaveCount(0);

      await page.goto("/carer/patients");
      await expect(page.getByRole("link", { name: /add event for/i })).toHaveCount(0);

      await page.goto(`/carer/patients/${s.clientId}/events/new`);
      await expect(page).toHaveURL(new RegExp(`/carer/patients/${s.clientId}/calendar`));
      await expect(page.getByLabel("Title")).toHaveCount(0);
    } finally {
      await cleanUp(s);
    }
  });
});
