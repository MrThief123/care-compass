import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

// [F0-25] Requires a running local Supabase stack and `.env.local` pointing at it (same
// convention as carer-client-info.spec.ts). The test seeds its own organisation, family member,
// client and information sections, and removes them afterwards. Do not run it against the
// hosted project: it writes rows there.
// Runs only against a local stack: the URL must be 127.0.0.1 or localhost, so a `.env.local`
// that points at the hosted project can never be written to by this spec.
const hasLocalSupabase = Boolean(
  /^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") &&
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
    .insert({ name: `f0-25-${stamp}` })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  const email = `f0-25-e2e-${stamp}@example.test`;
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

  // Two files the same name, to prove the zip keeps both.
  const files = [
    { name: "Care plan.pdf", body: "%PDF-1.4 care plan", at: "2026-10-01T00:00:00Z" },
    {
      name: "Care plan.pdf",
      body: "%PDF-1.4 second care plan, longer",
      at: "2026-10-02T00:00:00Z",
    },
    { name: "Exercise plan.pdf", body: "%PDF-1.4 exercise", at: "2026-10-03T00:00:00Z" },
  ];
  for (const file of files) {
    const id = crypto.randomUUID();
    const path = `clients/${client.data.id}/${id}/${file.name}`;
    const upload = await admin.storage
      .from("client-documents")
      .upload(path, new Blob([file.body], { type: "application/pdf" }), {
        contentType: "application/pdf",
      });
    if (upload.error) throw upload.error;
    const row = await admin.from("documents").insert({
      id,
      client_id: client.data.id,
      storage_path: path,
      filename: file.name,
      mime_type: "application/pdf",
      size_bytes: file.body.length,
      uploaded_by: user.data.user.id,
      uploaded_at: file.at,
    });
    if (row.error) throw row.error;
  }

  return { admin, orgId: org.data.id, userId: user.data.user.id, email, clientId: client.data.id };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  await s.admin.auth.admin.deleteUser(s.userId);
  await s.admin.from("clients").delete().eq("id", s.clientId);
  await s.admin.from("organisations").delete().eq("id", s.orgId);
}

async function signIn(page: import("@playwright/test").Page, email: string, clientId: string) {
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle"); // hydrated, so the form has its handler
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(`/family/${clientId}/home`);
}

test.describe(() => {
  test.skip(!hasLocalSupabase, "Requires a running local Supabase stack — see README.");

  test("[F0-25][AC-01][AC-04][AC-05][AC-06] given three documents, Helen finds Documents in the rail, sees all of them, searches and sorts", async ({
    page,
  }) => {
    const s = await seed();
    try {
      await signIn(page, s.email, s.clientId);
      await page.getByRole("link", { name: "Documents" }).click();
      await expect(page).toHaveURL(`/family/${s.clientId}/documents`);
      await page.waitForLoadState("networkidle");

      const rows = page.getByRole("row");
      await expect(rows).toHaveCount(4); // header + 3
      await expect(page.getByRole("status").first()).toHaveText("3 documents");
      // Newest first by default.
      await expect(rows.nth(1)).toContainText("Exercise plan.pdf");

      await page.getByRole("searchbox", { name: "Search documents" }).fill("exercise");
      await expect(rows).toHaveCount(2);
      await page.getByRole("searchbox", { name: "Search documents" }).fill("");

      await page.getByLabel("Sort by").selectOption("name-asc");
      await expect(rows.nth(1)).toContainText("Care plan.pdf");
      await page.getByLabel("Sort by").selectOption("size-desc");
      await expect(rows.nth(1)).toContainText("Care plan.pdf"); // the longer second upload
    } finally {
      await cleanUp(s);
    }
  });

  test("[F0-25][AC-09][AC-10] Download all returns a zip with every file (duplicates kept), and is refused without a session", async ({
    page,
    request,
  }) => {
    const s = await seed();
    try {
      await signIn(page, s.email, s.clientId);
      const url = `/api/clients/${s.clientId}/documents/download-all`;

      const response = await page.request.get(url);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toBe("application/zip");
      const body = await response.body();
      expect(body.subarray(0, 2).toString()).toBe("PK");
      const text = body.toString("latin1");
      for (const name of ["Care plan.pdf", "Care plan (2).pdf", "Exercise plan.pdf"]) {
        expect(text).toContain(name);
      }

      // A fresh context has no session.
      const anonymous = await request.get(url, { failOnStatusCode: false });
      expect([401, 307]).toContain(anonymous.status());
      expect(anonymous.headers()["content-type"] ?? "").not.toContain("application/zip");
    } finally {
      await cleanUp(s);
    }
  });
});
