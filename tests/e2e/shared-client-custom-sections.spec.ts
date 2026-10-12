import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

// [F0-26] T-14. Requires a running local Supabase stack and `.env.local` pointing at it (same
// convention as auth.spec.ts). The test seeds its own organisation, family member and client,
// and removes them afterwards. Do not run it against the hosted project: it writes rows there.
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
    .insert({ name: `f0-26-${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  const email = `f0-26-e2e-${stamp}@example.test`;
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

  return { admin, orgId: org.data.id, userId: user.data.user.id, email, clientId: client.data.id };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  // The client first: its sections go with it and no longer name the user as their saver.
  await s.admin.from("clients").delete().eq("id", s.clientId);
  await s.admin.auth.admin.deleteUser(s.userId);
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

  test("[F0-26][AC-02][AC-04][AC-06] T-14 family adds, renames, edits and removes a custom section, and each change survives a reload", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signIn(page, s.email, s.clientId);
      await page.goto(`/family/${s.clientId}/info`);

      // Add
      await page.getByRole("button", { name: "Add section" }).click();
      const form = page.getByRole("form", { name: "New section" });
      await form.getByLabel("Title").fill("Communication");
      await form.getByLabel("Text").fill("Short sentences.");
      await form.getByRole("button", { name: "Save" }).click();
      await expect(page.getByRole("heading", { level: 2, name: "Communication" })).toBeVisible();
      await page.reload();
      const headings = page.getByRole("heading", { level: 2 });
      await expect(headings).toHaveText([
        "Description",
        "Habits",
        "Medical history",
        "Communication",
        "Documentation",
      ]);
      await expect(page.getByText("Short sentences.")).toBeVisible();

      // Rename and edit
      await page.getByRole("button", { name: "Edit Communication" }).click();
      await page.getByLabel("Title").fill("Talking with Margaret");
      await page.getByLabel("Text").fill("Speak on her right side.");
      await page.getByRole("button", { name: "Save" }).click();
      await expect(page.getByRole("region", { name: "Talking with Margaret" })).toBeVisible();
      await page.reload();
      const renamed = page.getByRole("region", { name: "Talking with Margaret" });
      await expect(renamed.getByText("Speak on her right side.")).toBeVisible();
      await expect(page.getByRole("region", { name: "Communication" })).toHaveCount(0);

      // Remove, after confirming
      await page.getByRole("button", { name: "Remove Talking with Margaret" }).click();
      await expect(
        renamed.getByText("Remove Talking with Margaret? Its text will be lost."),
      ).toBeVisible();
      await renamed.getByRole("button", { name: "Remove", exact: true }).click();
      await expect(page.getByRole("region", { name: "Talking with Margaret" })).toHaveCount(0);
      await page.reload();
      await expect(page.getByRole("heading", { level: 2 })).toHaveText([
        "Description",
        "Habits",
        "Medical history",
        "Documentation",
      ]);
    } finally {
      await cleanUp(s);
    }
  });
});
