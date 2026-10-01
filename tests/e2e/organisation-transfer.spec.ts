import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

import { totpCode } from "../helpers/totp";

loadEnv({ path: ".env.local" });

// [INT-02] Requires a running local Supabase stack and `.env.local` pointing at it (same
// convention as carer-complete-task.spec.ts, family-client-info.spec.ts). The test seeds two
// organisations, an admin for each, a carer, a family member, a client and one completed task,
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

/**
 * Banksia (Margaret's organisation: Priya admin, Aisha carer on an active shift) and Wattle (Omar
 * admin, nobody assigned yet). Helen is Margaret's family. One already-completed Physiotherapy
 * task, so AC-02 has history to find after the transfer.
 */
async function seed() {
  const admin = adminClient();
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const banksia = await admin
    .from("organisations")
    .insert({ name: `Banksia int-02-${stamp}` })
    .select("id")
    .single();
  if (banksia.error || !banksia.data) throw banksia.error ?? new Error("banksia");
  const wattle = await admin
    .from("organisations")
    .insert({ name: `Wattle int-02-${stamp}` })
    .select("id")
    .single();
  if (wattle.error || !wattle.data) throw wattle.error ?? new Error("wattle");

  async function person(
    label: string,
    role: "admin" | "carer" | "family",
    organisationId: string | null,
    first: string,
    last: string,
  ) {
    const email = `int-02-${label}-${stamp}@example.test`;
    const user = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (user.error || !user.data.user) throw user.error ?? new Error(label);
    const profile = await admin.from("profiles").insert({
      id: user.data.user.id,
      role,
      organisation_id: organisationId,
      first_name: first,
      last_name: last,
    });
    if (profile.error) throw profile.error;
    return { id: user.data.user.id, email };
  }

  /**
   * Pre-enrols and verifies a TOTP factor via the API, so an admin's sign-in during the test
   * lands straight on their dashboard instead of F0-07's forced `/mfa/enroll` (F0-20's hardening
   * isn't merged yet, but the gate itself is live) — this journey is about the transfer, not MFA,
   * which `admin-mfa.spec.ts` already covers on its own.
   */
  async function enrolAdminTotp(email: string): Promise<string> {
    const session = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const signedIn = await session.auth.signInWithPassword({ email, password: PASSWORD });
    if (signedIn.error) throw signedIn.error;
    const enrolled = await session.auth.mfa.enroll({ factorType: "totp" });
    if (enrolled.error || !enrolled.data) throw enrolled.error ?? new Error("enrol");
    const challenge = await session.auth.mfa.challenge({ factorId: enrolled.data.id });
    if (challenge.error || !challenge.data) throw challenge.error ?? new Error("challenge");
    const verified = await session.auth.mfa.verify({
      factorId: enrolled.data.id,
      challengeId: challenge.data.id,
      code: totpCode(enrolled.data.totp.secret),
    });
    if (verified.error) throw verified.error;
    await session.auth.signOut();
    // Enrolling satisfies this session's challenge, but a *later* sign-in (the UI journey
    // below) still hits F0-07's sign-in-time MFA gate (AC-10) now that a factor exists — the
    // secret is kept so that step can compute a fresh code too.
    return enrolled.data.totp.secret;
  }

  const priya = await person("priya", "admin", banksia.data.id, "Priya", "Nair");
  const omar = await person("omar", "admin", wattle.data.id, "Omar", "Said");
  const aisha = await person("aisha", "carer", banksia.data.id, "Aisha", "Rahman");
  const helen = await person("helen", "family", null, "Helen", "Doyle");
  const priyaTotpSecret = await enrolAdminTotp(priya.email);
  const omarTotpSecret = await enrolAdminTotp(omar.email);

  const client = await admin
    .from("clients")
    .insert({
      first_name: "Margaret",
      last_name: `Doyle-${stamp}`,
      organisation_id: banksia.data.id,
      suburb: "Preston VIC",
    })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");

  const link = await admin
    .from("client_family_members")
    .insert({ client_id: client.data.id, profile_id: helen.id, relationship_label: "Daughter" });
  if (link.error) throw link.error;

  const shift = await admin.from("shifts").insert({
    client_id: client.data.id,
    carer_id: aisha.id,
    starts_at: at(-HOUR),
    ends_at: at(HOUR),
  });
  if (shift.error) throw shift.error;

  const eventStart = at(-24 * HOUR);
  const event = await admin
    .from("care_events")
    .insert({ client_id: client.data.id, title: "Physiotherapy", starts_at: eventStart })
    .select("id")
    .single();
  if (event.error || !event.data) throw event.error ?? new Error("event");

  const completion = await admin.from("care_event_completions").insert({
    event_id: event.data.id,
    client_id: client.data.id,
    original_start: eventStart,
    action: "done",
    actor_id: aisha.id,
    actor_display_name: "Aisha Rahman",
    organisation_id: banksia.data.id,
  });
  if (completion.error) throw completion.error;

  return {
    admin,
    banksiaId: banksia.data.id,
    wattleId: wattle.data.id,
    wattleName: `Wattle int-02-${stamp}`,
    priya,
    omar,
    aisha,
    helen,
    priyaTotpSecret,
    omarTotpSecret,
    clientId: client.data.id,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.priya, s.omar, s.aisha, s.helen])
    await s.admin.auth.admin.deleteUser(user.id);
  await s.admin.from("shifts").delete().eq("client_id", s.clientId);
  // Completions are append-only, so Margaret is left behind (unique name/stamp, as CAR-06's test does).
  await s.admin.from("clients").delete().eq("id", s.clientId);
  await s.admin.from("organisations").delete().eq("id", s.banksiaId);
  await s.admin.from("organisations").delete().eq("id", s.wattleId);
}

/** `totpSecret`: an admin with an enrolled factor hits F0-07's sign-in-time MFA challenge
 * (AC-10) every time, not only once — absent for the carer and family member, who have none. */
async function signIn(page: import("@playwright/test").Page, email: string, totpSecret?: string) {
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle"); // hydrated, so Sign in submits through its handler, not a bare GET
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));

  if (totpSecret && page.url().includes("/mfa/verify")) {
    await page.getByLabel("6-digit code").fill(totpCode(totpSecret));
    await page.getByRole("button", { name: "Verify" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/mfa/verify"));
  }
}

test.describe(() => {
  test.skip(!hasLocalSupabase, "Requires a running local Supabase stack — see README.");

  test("[INT-02][AC-01][AC-02][AC-03] T-01/T-02/T-03 the full organisation transfer journey: Banksia loses access, Wattle gains it, history is kept", async ({
    browser,
  }, testInfo) => {
    testInfo.setTimeout(90_000); // four browser contexts, several sign-ins and navigations
    const s = await seed();
    const helenContext = await browser.newContext();
    const priyaContext = await browser.newContext();
    const aishaContext = await browser.newContext();
    const omarContext = await browser.newContext();
    try {
      // Before the transfer: Priya (Banksia) and Aisha (on shift) can both see Margaret.
      const priya = await priyaContext.newPage();
      await signIn(priya, s.priya.email, s.priyaTotpSecret);
      await priya.goto("/admin/clients");
      await expect(priya.getByText("Margaret")).toBeVisible();

      const aisha = await aishaContext.newPage();
      await signIn(aisha, s.aisha.email);
      await aisha.goto("/carer/patients");
      await expect(aisha.getByText("Margaret")).toBeVisible();

      // Helen moves Margaret's care to Wattle.
      const helen = await helenContext.newPage();
      await signIn(helen, s.helen.email);
      await helen.goto(`/family/${s.clientId}/settings`);
      await helen.getByRole("button", { name: "Change" }).click();
      await helen.getByRole("radio", { name: s.wattleName }).click();
      await helen.getByRole("button", { name: "Continue" }).click();
      await helen.getByRole("button", { name: "Change organisation" }).click();
      await expect(helen.getByText(/care has moved to Wattle/)).toBeVisible();

      // AC-01: Banksia's admin and Margaret's (now-ended) carer both lose her on reload.
      await priya.reload();
      await expect(priya.getByText("Margaret")).not.toBeVisible();

      await aisha.reload();
      await expect(aisha.getByText("Margaret")).not.toBeVisible();

      // AC-03: Wattle's admin gains her.
      const omar = await omarContext.newPage();
      await signIn(omar, s.omar.email, s.omarTotpSecret);
      await omar.goto("/admin/clients");
      await expect(omar.getByText("Margaret")).toBeVisible();

      // AC-02: the Physiotherapy completion from before the transfer is still in the Task log.
      await helen.goto(`/family/${s.clientId}/tasks`);
      await expect(helen.getByText("Physiotherapy")).toBeVisible();
    } finally {
      await helenContext.close();
      await priyaContext.close();
      await aishaContext.close();
      await omarContext.close();
      await cleanUp(s);
    }
  });
});
