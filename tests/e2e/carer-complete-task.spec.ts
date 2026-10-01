import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

// [CAR-06] Requires a running local Supabase stack and `.env.local` pointing at it (same
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
    .insert({ name: `car-06-${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  async function person(label: string, role: "carer" | "family", first: string, last: string) {
    const email = `car-06-${label}-${stamp}@example.test`;
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

  test("[CAR-06][AC-01] T-01 given Aisha on shift with Margaret, when she ticks Physiotherapy in Margaret's Calendar, Margaret's family sees it done by 'Aisha Rahman'", async ({
    browser,
  }) => {
    const s = await seed();
    const carerContext = await browser.newContext();
    const familyContext = await browser.newContext();
    try {
      const carer = await carerContext.newPage();
      await signIn(carer, s.aisha.email);
      await carer.goto(`/carer/patients/${s.clientId}/calendar`);
      await carer.waitForLoadState("networkidle"); // hydrated, so the checkbox has its handler

      const tasks = carer.getByRole("region", { name: "Tasks" });
      const box = tasks.getByLabel("Physiotherapy");
      await box.check();
      await expect(box).toBeChecked();
      await carer.reload();
      await expect(
        carer.getByRole("region", { name: "Tasks" }).getByLabel("Physiotherapy"),
      ).toBeChecked();
      // Every link on the carer's Calendar stays in the carer area.
      expect(await carer.locator('a[href^="/family/"]').count()).toBe(0);

      const family = await familyContext.newPage();
      await signIn(family, s.helen.email);
      await family.goto(`/family/${s.clientId}/home`);
      await expect(family.getByText("Done · Aisha Rahman").first()).toBeVisible();
    } finally {
      await carerContext.close();
      await familyContext.close();
      await cleanUp(s);
    }
  });

  test("[CAR-06][AC-02] given Aisha's shift with Margaret has not started, the Calendar lists the task but cannot tick it", async ({
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

      const tasks = page.getByRole("region", { name: "Tasks" });
      await expect(tasks.getByText("Physiotherapy")).toBeVisible();
      await expect(tasks.getByRole("checkbox")).toHaveCount(0);
      await expect(page.getByRole("note")).toContainText("View only");
    } finally {
      await cleanUp(s);
    }
  });
});
