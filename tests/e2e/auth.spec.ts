import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

// Requires a running local Supabase stack (`supabase start`) and `.env.local`
// populated from `supabase status` (same convention as the integration tests —
// see tests/integration/shared-authentication.test.ts).
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
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

async function seedProfile(role: "family" | "carer", organisationId: string | null) {
  const admin = adminClient();
  const email = `f0-07-e2e-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("failed to create the e2e test user");

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    role,
    organisation_id: organisationId,
    first_name: "Test",
    last_name: role,
  });
  if (profileError) throw profileError;

  return { userId: data.user.id, email };
}

async function seedFamilyWithClient() {
  const admin = adminClient();
  const { userId, email } = await seedProfile("family", null);

  const { data: client, error: clientError } = await admin
    .from("clients")
    .insert({ first_name: "E2E", last_name: "Client", organisation_id: null })
    .select("id")
    .single();
  if (clientError || !client)
    throw clientError ?? new Error("failed to create the e2e test client");

  const { error: linkError } = await admin
    .from("client_family_members")
    .insert({ client_id: client.id, profile_id: userId });
  if (linkError) throw linkError;

  return { userId, email, clientId: client.id };
}

async function cleanUp(userId: string) {
  await adminClient().auth.admin.deleteUser(userId);
}

test.describe(() => {
  test.skip(!hasLocalSupabase, "Requires a running local Supabase stack — see README.");

  test("[F0-07][AC-01] a family sign-in lands on /family/<client id>/home", async ({ page }) => {
    const { userId, email, clientId } = await seedFamilyWithClient();
    try {
      await page.goto("/sign-in");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();

      await expect(page).toHaveURL(`/family/${clientId}/home`);
    } finally {
      await cleanUp(userId);
    }
  });

  test("[F0-07][AC-03] a carer sign-in lands on /carer/home", async ({ page }) => {
    const { userId, email } = await seedProfile("carer", null);
    try {
      await page.goto("/sign-in");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();

      await expect(page).toHaveURL("/carer/home");
    } finally {
      await cleanUp(userId);
    }
  });
});
