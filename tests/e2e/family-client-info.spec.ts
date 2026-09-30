import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

// [FAM-09] Requires a running local Supabase stack and `.env.local` pointing at it (same
// convention as carer-client-info.spec.ts). The test seeds its own organisation, family member,
// client and information sections, and removes them afterwards. Do not run it against the
// hosted project: it writes rows there.
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
    .insert({ name: `fam-09-${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  const email = `fam-09-e2e-${stamp}@example.test`;
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
  const sections = await admin
    .from("client_info_sections")
    .insert([{ client_id: client.data.id, key: "habits", body: "Tea at 7am." }]);
  if (sections.error) throw sections.error;

  return { admin, orgId: org.data.id, userId: user.data.user.id, email, clientId: client.data.id };
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

  test("[FAM-09][AC-01] T-01 given Margaret's Habits, when Helen edits and saves, the new text shows and survives a reload", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signIn(page, s.email, s.clientId);
      await page.goto(`/family/${s.clientId}/info`);

      await expect(page.getByText("Tea at 7am.")).toBeVisible();
      await page.getByRole("button", { name: "Edit Habits" }).click();
      await page.getByRole("textbox", { name: "Habits" }).fill("Tea at 6am, then a walk.");
      await page.getByRole("button", { name: "Save" }).click();

      // Edit returns only once the save has finished; the text alone would also match the open textarea.
      await expect(page.getByRole("button", { name: "Edit Habits" })).toBeVisible();
      await expect(page.getByText("Tea at 6am, then a walk.")).toBeVisible();
      await page.reload();
      await expect(page.getByText("Tea at 6am, then a walk.")).toBeVisible();

      // The audit row names Helen as the family actor (AC-09).
      const audit = await s.admin
        .from("audit_log")
        .select("actor_id, actor_role, action")
        .eq("table_name", "client_info_sections")
        .eq("client_id", s.clientId)
        .eq("actor_id", s.userId);
      expect(audit.data?.length).toBeGreaterThan(0);
      expect(audit.data?.[0]?.actor_role).toBe("family");
    } finally {
      await cleanUp(s);
    }
  });

  test("[FAM-09][AC-03][AC-08] given a section never written and text over 5,000 characters, the empty card offers Edit and the long save is refused with the draft kept", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signIn(page, s.email, s.clientId);
      await page.goto(`/family/${s.clientId}/info`);
      await page.waitForLoadState("networkidle"); // hydrated, so Save has its handler

      const medical = page.getByRole("region", { name: "Medical history" });
      await expect(medical.getByText("Nothing added yet.")).toBeVisible();
      await medical.getByRole("button", { name: "Edit Medical history" }).click();
      await medical.getByRole("textbox").fill("x".repeat(5001));
      await medical.getByRole("button", { name: "Save" }).click();

      await expect(medical.getByText("Keep it to 5,000 characters or fewer.")).toBeVisible();
      await expect(medical.getByRole("textbox")).toHaveValue("x".repeat(5001));
      const saved = await s.admin
        .from("client_info_sections")
        .select("body")
        .eq("client_id", s.clientId)
        .eq("key", "medical_history");
      expect(saved.data).toEqual([]);
    } finally {
      await cleanUp(s);
    }
  });

  test("[FAM-09][AC-05][AC-06] T-05 given the Documentation card, when Helen adds 'Care plan.pdf' a tile appears and is listed after a reload; a file over 20 MB is refused", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signIn(page, s.email, s.clientId);
      await page.goto(`/family/${s.clientId}/info`);
      await page.waitForLoadState("networkidle"); // hydrated, so the file input has its handler
      const chooser = page.locator('input[type="file"]');
      const pdf = (bytes: number) =>
        Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(bytes - 9, 32)]);

      await chooser.setInputFiles({
        name: "Care plan.pdf",
        mimeType: "application/pdf",
        buffer: pdf(64 * 1024),
      });
      const documentation = page.getByRole("region", { name: "Documentation" });
      await expect(documentation.getByText("Care plan.pdf")).toBeVisible({ timeout: 20_000 });
      await page.reload();
      await expect(documentation.getByRole("button", { name: "Care plan.pdf" })).toBeVisible();

      await chooser.setInputFiles({
        name: "Too big.pdf",
        mimeType: "application/pdf",
        buffer: pdf(20 * 1024 * 1024 + 512 * 1024),
      });
      await expect(documentation.getByText("Files must be 20MB or smaller.")).toBeVisible();
      await expect(documentation.getByText("Too big.pdf")).toHaveCount(0);

      const rows = await s.admin
        .from("documents")
        .select("filename, event_id")
        .eq("client_id", s.clientId);
      expect(rows.data).toEqual([{ filename: "Care plan.pdf", event_id: null }]);
    } finally {
      await cleanUp(s);
    }
  });
});
