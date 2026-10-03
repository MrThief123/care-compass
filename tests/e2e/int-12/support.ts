import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { test as base, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

import { freshTotpCode, totpCode } from "../../helpers/totp";

import type { Browser, BrowserContext, Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";

export { countEmailsTo, waitForEmailLink } from "../../helpers/mailpit";

// INT-12 harness (Phase 0). `.env.local` points at the HOSTED project, so it is loaded only so the
// guard below can see that and refuse; a real run passes the local stack's variables explicitly.
loadEnv({ path: ".env.local" });

export const PASSWORD = "correct horse battery staple 1!";
export const NEW_PASSWORD = "a brand new password 2!";

const LOCAL_URL = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/;

type Env = Record<string, string | undefined>;

/**
 * AC-01 / FR-01: why INT-12 must not run here, or null when it may. Never touches a database.
 * Local address, the real-data source, and both keys: anything less and every INT-12 test skips.
 */
export function skipReason(env: Env = process.env): string | null {
  if (!LOCAL_URL.test(env.NEXT_PUBLIC_SUPABASE_URL ?? "")) {
    return "INT-12 only runs against a local Supabase stack: NEXT_PUBLIC_SUPABASE_URL is not a local address (.env.local is the hosted project; pass the local stack's variables).";
  }
  if (env.E2E_DATA_SOURCE !== "supabase") {
    return "INT-12 needs E2E_DATA_SOURCE=supabase (it checks real data, not the mock data source).";
  }
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return "INT-12 needs NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY from `supabase status -o env`.";
  }
  return null;
}

/** Every write goes through this first, so a hosted URL fails before any client is created. */
export function assertLocal(env: Env = process.env): void {
  const reason = skipReason(env);
  if (reason) throw new Error(reason);
}

/** Service role: seed and clean-up only, never a check of what a role can see (PRD Security). */
export function serviceClient(env: Env = process.env): SupabaseClient {
  assertLocal(env);
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function anonClient(): SupabaseClient {
  assertLocal();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export type Role = "family" | "carer" | "admin";

export interface Person {
  id: string;
  email: string;
  first: string;
  last: string;
  role: Role;
}

export interface AdminPerson extends Person {
  /** Base32 TOTP secret of the admin's verified factor (CHG-040: admins only). */
  totpSecret: string;
}

export interface World {
  runId: string;
  /** `int-12-<runId>`: in every email and organisation name this run creates (FR-02). */
  marker: string;
  orgId: string;
  orgName: string;
  admin: AdminPerson;
  carer: Person;
  family: Person;
  client: { id: string; first: string; last: string };
  /** Everything this run created, so clean-up needs no guessing. */
  tracked: { orgIds: string[]; userIds: string[]; clientIds: string[] };
}

export function newRunId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const markerFor = (runId: string) => `int-12-${runId}`;

/** A confirmed account plus its profile; the email carries the run marker. */
export async function createPerson(
  runId: string,
  role: Role,
  first: string,
  last: string,
  organisationId: string | null,
  tag: string = role,
): Promise<Person> {
  const db = serviceClient();
  const email = `${markerFor(runId)}-${tag}@example.test`;
  const user = await db.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (user.error || !user.data.user) throw user.error ?? new Error(`createUser ${tag}`);
  const profile = await db.from("profiles").insert({
    id: user.data.user.id,
    role,
    organisation_id: organisationId,
    first_name: first,
    last_name: last,
    email,
  });
  if (profile.error) throw profile.error;
  return { id: user.data.user.id, email, first, last, role };
}

/** Enrols and verifies a TOTP factor through Supabase Auth's real API, like the app's own pages. */
async function enrolTotp(email: string): Promise<string> {
  const client = anonClient();
  const signedIn = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signedIn.error) throw signedIn.error;
  const enrolled = await client.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `int-12-${Date.now()}`,
  });
  if (enrolled.error || !enrolled.data) throw enrolled.error ?? new Error("mfa enrol");
  const secret = enrolled.data.totp.secret;
  const verified = await client.auth.mfa.challengeAndVerify({
    factorId: enrolled.data.id,
    code: totpCode(secret),
  });
  if (verified.error) throw verified.error;
  await client.auth.signOut();
  return secret;
}

/** AC-02: a fresh organisation, admin (with TOTP), carer, family and client, all marked. */
export async function seedWorld(runId: string = newRunId()): Promise<World> {
  const db = serviceClient();
  const marker = markerFor(runId);
  const tracked: World["tracked"] = { orgIds: [], userIds: [], clientIds: [] };
  try {
    const org = await db.from("organisations").insert({ name: marker }).select("id").single();
    if (org.error || !org.data) throw org.error ?? new Error("organisation");
    tracked.orgIds.push(org.data.id);

    const adminPerson = await createPerson(runId, "admin", "Priya", "Shah", org.data.id);
    tracked.userIds.push(adminPerson.id);
    const carer = await createPerson(runId, "carer", "Aisha", "Rahman", org.data.id);
    tracked.userIds.push(carer.id);
    const family = await createPerson(runId, "family", "Helen", "Carter", null);
    tracked.userIds.push(family.id);

    const client = await db
      .from("clients")
      .insert({ first_name: "Margaret", last_name: "Carter", organisation_id: org.data.id })
      .select("id")
      .single();
    if (client.error || !client.data) throw client.error ?? new Error("client");
    tracked.clientIds.push(client.data.id);
    const link = await db
      .from("client_family_members")
      .insert({ client_id: client.data.id, profile_id: family.id });
    if (link.error) throw link.error;

    const totpSecret = await enrolTotp(adminPerson.email);
    return {
      runId,
      marker,
      orgId: org.data.id,
      orgName: marker,
      admin: { ...adminPerson, totpSecret },
      carer,
      family,
      client: { id: client.data.id, first: "Margaret", last: "Carter" },
      tracked,
    };
  } catch (error) {
    // A half-made world is still cleaned up, so a failed seed leaves nothing behind either.
    await cleanUpTracked(runId, tracked);
    throw error;
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The tables whose rows cannot be deleted by the API on purpose (append-only triggers). On the LOCAL
 * stack only, their rows for this run's clients are removed in the local Postgres container with
 * triggers off for that one transaction, so nothing a run created outlives it (AC-02, FD-07).
 */
const APPEND_ONLY_BY_CLIENT = [
  "care_event_completions",
  "budget_costs",
  "budget_fund_entries",
  "documents",
] as const;

/**
 * This project's own local database container, named from `project_id` in supabase/config.toml.
 * Never "the first supabase_db_ container": another local stack may be running, and a purge must
 * reach only the database the suite just seeded (the one `NEXT_PUBLIC_SUPABASE_URL` points at).
 */
function dbContainer(): string {
  const config = readFileSync(join(process.cwd(), "supabase/config.toml"), "utf8");
  const projectId = /^project_id\s*=\s*"([^"]+)"/m.exec(config)?.[1];
  if (!projectId) throw new Error("no project_id in supabase/config.toml");
  const name = `supabase_db_${projectId}`;
  const running = execFileSync("docker", [
    "ps",
    "--filter",
    `name=^${name}$`,
    "--format",
    "{{.Names}}",
  ])
    .toString()
    .trim();
  if (running !== name) throw new Error(`the local database container ${name} is not running`);
  return name;
}

function purgeAppendOnly(clientIds: string[], userIds: string[]): void {
  if (![...clientIds, ...userIds].every((id) => UUID.test(id))) {
    throw new Error("refusing to purge: an id is not a uuid");
  }
  if (clientIds.length === 0) return;
  const clients = clientIds.map((id) => `'${id}'`).join(",");
  const users = userIds.map((id) => `'${id}'`).join(",");
  const sql = [
    "begin;",
    "set local session_replication_role = replica;",
    ...APPEND_ONLY_BY_CLIENT.map(
      (table) => `delete from ${table} where client_id in (${clients});`,
    ),
    users ? `delete from audit_log where actor_id in (${users});` : "",
    "commit;",
  ].join("\n");
  execFileSync(
    "docker",
    ["exec", "-i", dbContainer(), "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-q"],
    {
      input: sql,
    },
  );
}

/** Removes everything a run created, in an order the foreign keys allow. */
export async function cleanUpTracked(runId: string, tracked: World["tracked"]): Promise<void> {
  const db = serviceClient();
  const marker = markerFor(runId);

  // Anything marked but not tracked (a sign-up the run did through the UI) is found by its marker.
  const orgs = await db.from("organisations").select("id").like("name", `${marker}%`);
  const orgIds = [...new Set([...tracked.orgIds, ...(orgs.data ?? []).map((o) => o.id as string)])];
  const users = await db.auth.admin.listUsers({ perPage: 1000 });
  const userIds = [
    ...new Set([
      ...tracked.userIds,
      ...(users.data?.users ?? [])
        .filter((u) => u.email?.startsWith(`${marker}-`))
        .map((u) => u.id),
    ]),
  ];
  const owned = orgIds.length
    ? await db.from("clients").select("id").in("organisation_id", orgIds)
    : { data: [] as { id: string }[] };
  const linked = userIds.length
    ? await db.from("client_family_members").select("client_id").in("profile_id", userIds)
    : { data: [] as { client_id: string }[] };
  const clientIds = [
    ...new Set([
      ...tracked.clientIds,
      ...(owned.data ?? []).map((c) => c.id),
      ...(linked.data ?? []).map((c) => c.client_id),
    ]),
  ];

  purgeAppendOnly(clientIds, userIds);

  if (orgIds.length) await db.from("shifts").delete().in("organisation_id", orgIds);
  if (clientIds.length) {
    await db.from("budget_buckets").delete().in("client_id", clientIds);
    await db.from("clients").delete().in("id", clientIds);
  }
  for (const id of userIds) await db.auth.admin.deleteUser(id);
  if (orgIds.length) await db.from("organisations").delete().in("id", orgIds);
}

export const cleanUp = (world: World) => cleanUpTracked(world.runId, world.tracked);

/** What of a run is still there (AC-02): empty means clean. Service role, local only. */
export async function leftovers(runId: string, clientIds: string[] = []): Promise<string[]> {
  const db = serviceClient();
  const marker = markerFor(runId);
  const found: string[] = [];
  const orgs = await db.from("organisations").select("id").like("name", `${marker}%`);
  if (orgs.data?.length) found.push(`organisations:${orgs.data.length}`);
  const profiles = await db.from("profiles").select("id").like("email", `${marker}-%`);
  if (profiles.data?.length) found.push(`profiles:${profiles.data.length}`);
  const users = await db.auth.admin.listUsers({ perPage: 1000 });
  const authUsers = (users.data?.users ?? []).filter((u) => u.email?.startsWith(`${marker}-`));
  if (authUsers.length) found.push(`auth.users:${authUsers.length}`);
  if (clientIds.length) {
    const clients = await db.from("clients").select("id").in("id", clientIds);
    if (clients.data?.length) found.push(`clients:${clients.data.length}`);
  }
  return found;
}

/** Rows in the append-only tables, so the harness can prove clean-up reaches them. */
export async function addAppendOnlyRows(world: World): Promise<void> {
  const db = serviceClient();
  const clientId = world.client.id;
  const event = await db
    .from("care_events")
    .insert({
      client_id: clientId,
      title: "Harness event",
      starts_at: new Date(Math.floor(Date.now() / 1000) * 1000 - 3_600_000).toISOString(),
    })
    .select("id, starts_at")
    .single();
  if (event.error || !event.data) throw event.error ?? new Error("event");
  const done = await db.from("care_event_completions").insert({
    event_id: event.data.id,
    client_id: clientId,
    original_start: event.data.starts_at,
    action: "done",
    actor_id: world.carer.id,
    actor_display_name: `${world.carer.first} ${world.carer.last}`,
    organisation_id: world.orgId,
  });
  if (done.error) throw done.error;
  const bucket = await db
    .from("budget_buckets")
    .insert({ client_id: clientId, name: "Harness bucket" })
    .select("id")
    .single();
  if (bucket.error || !bucket.data) throw bucket.error ?? new Error("bucket");
  const funds = await db.from("budget_fund_entries").insert({
    bucket_id: bucket.data.id,
    client_id: clientId,
    kind: "bucket_added",
    amount: 100,
    recorded_by: world.family.id,
    recorded_by_name: `${world.family.first} ${world.family.last}`,
  });
  if (funds.error) throw funds.error;
}

/**
 * The test every INT-12 phase uses. `world` is seeded fresh and removed afterwards, also when the
 * test fails (AC-02). A run that may not happen here skips with the reason (AC-01); the skip is
 * decided before anything is written.
 */
export const journey = base.extend<{ world: World; guard: void }>({
  // Automatic: every INT-12 test skips with the reason before anything runs, whether or not it
  // takes `world` (AC-01).
  guard: [
    async ({}, provide, testInfo) => {
      const reason = skipReason();
      if (reason) testInfo.skip(true, reason);
      await provide();
    },
    { auto: true },
  ],
  // Named `provide`, not `use`: Playwright's second fixture argument is not a React hook.
  world: async ({ guard }, provide) => {
    void guard; // depend on the guard so a disallowed run never seeds
    const world = await seedWorld();
    try {
      await provide(world);
    } finally {
      await cleanUp(world);
    }
  },
});

export { expect };

// ---------------------------------------------------------------------------
// Signed-in contexts
// ---------------------------------------------------------------------------

export interface Session {
  context: BrowserContext;
  page: Page;
}

/** Signs a person in through the UI; an admin also completes the TOTP challenge. */
export async function signIn(page: Page, person: Person | AdminPerson, password = PASSWORD) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(person.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  if (person.role === "admin") {
    await expect(page).toHaveURL(/\/mfa\/verify$/);
    await page
      .getByLabel("6-digit code")
      .fill(await freshTotpCode((person as AdminPerson).totpSecret));
    await page.getByRole("button", { name: "Verify" }).click();
  }
}

export function homeUrl(world: World, role: Role): RegExp {
  if (role === "admin") return /\/admin\/home$/;
  if (role === "carer") return /\/carer\/home$/;
  return new RegExp(`/family/${world.client.id}/home$`);
}

/** Family, Carer and Admin each in their own browser context, all signed in at the same time. */
export async function openRoles(
  browser: Browser,
  world: World,
  baseURL: string | undefined,
): Promise<Record<Role, Session>> {
  const sessions = {} as Record<Role, Session>;
  for (const role of ["family", "carer", "admin"] as const) {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await signIn(page, world[role]);
    await expect(page).toHaveURL(homeUrl(world, role));
    sessions[role] = { context, page };
  }
  return sessions;
}

export async function closeRoles(sessions: Record<Role, Session>): Promise<void> {
  for (const { context } of Object.values(sessions)) await context.close();
}
