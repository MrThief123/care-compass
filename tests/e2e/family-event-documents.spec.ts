import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

// [FAM-08] Requires a running local Supabase stack and `.env.local` pointing at it (same
// convention as family-client-info.spec.ts, FAM-09). The test seeds its own organisation,
// family member, client and care event, and removes them afterwards. Do not run it against
// the hosted project: it writes rows there.
const hasLocalSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const PASSWORD = "correct horse battery staple 1!";

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
    .insert({ name: `fam-08-${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  const email = `fam-08-e2e-${stamp}@example.test`;
  const user = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (user.error || !user.data.user) throw user.error ?? new Error("user");
  const profile = await admin.from("profiles").insert({
    id: user.data.user.id,
    role: "family",
    organisation_id: null,
    first_name: "Helen",
    last_name: "Doyle",
  });
  if (profile.error) throw profile.error;

  const client = await admin
    .from("clients")
    .insert({
      first_name: "Margaret",
      last_name: "Doyle",
      organisation_id: org.data.id,
      suburb: "Preston VIC",
    })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");

  const link = await admin.from("client_family_members").insert({
    client_id: client.data.id,
    profile_id: user.data.user.id,
    relationship_label: "Daughter",
  });
  if (link.error) throw link.error;

  const event = await admin
    .from("care_events")
    .insert({
      client_id: client.data.id,
      title: "Physiotherapy",
      // care_events.starts_at must be a whole second (care_events_starts_at_whole_second).
      starts_at: new Date(Math.floor((Date.now() + 60 * 60_000) / 1000) * 1000).toISOString(),
    })
    .select("id")
    .single();
  if (event.error || !event.data) throw event.error ?? new Error("event");

  return {
    admin,
    orgId: org.data.id,
    userId: user.data.user.id,
    email,
    clientId: client.data.id,
    eventId: event.data.id,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  await s.admin.auth.admin.deleteUser(s.userId);
  await s.admin.from("clients").delete().eq("id", s.clientId);
  await s.admin.from("organisations").delete().eq("id", s.orgId);
}

async function signIn(page: import("@playwright/test").Page, email: string, clientId: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(`/family/${clientId}/home`);
}

test.describe(() => {
  test.skip(!hasLocalSupabase, "Requires a running local Supabase stack — see README.");

  test("[FAM-08][AC-01] T-01 given the Edit event form, when Helen adds 'Physio referral.pdf' and saves, a tile appears and survives a reload, linked to the event", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signIn(page, s.email, s.clientId);
      await page.goto(`/family/${s.clientId}/events/${s.eventId}/edit`);
      await page.waitForLoadState("networkidle"); // hydrated, so the file input has its handler

      const documents = page.getByRole("region", { name: "Documents" });
      await expect(documents.getByText("Physio referral.pdf")).not.toBeVisible();

      const chooser = page.locator('input[type="file"]');
      const pdf = (bytes: number) =>
        Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(bytes - 9, 32)]);
      await chooser.setInputFiles({
        name: "Physio referral.pdf",
        mimeType: "application/pdf",
        buffer: pdf(64 * 1024),
      });

      await expect(documents.getByText("Physio referral.pdf")).toBeVisible({ timeout: 20_000 });
      await page.reload();
      await expect(
        page.getByRole("region", { name: "Documents" }).getByRole("button", {
          name: "Physio referral.pdf",
        }),
      ).toBeVisible();

      const saved = await s.admin
        .from("documents")
        .select("client_id, event_id, filename")
        .eq("filename", "Physio referral.pdf")
        .eq("client_id", s.clientId);
      expect(saved.data).toHaveLength(1);
      expect(saved.data?.[0]?.event_id).toBe(s.eventId);
    } finally {
      await cleanUp(s);
    }
  });
});
