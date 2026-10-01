// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

import { stepUpToAal2 } from "../helpers/aal2";

// F0-21 Auth security audit, against a LOCAL Supabase stack only (it creates users):
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
//   SUPABASE_SERVICE_ROLE_KEY=... npx vitest run tests/integration/shared-auth-security-audit.test.ts
// Every call goes through the real data API (PostgREST, Storage, Auth) with a real user's JWT: the
// path an attacker who skips the screens would take. Fresh users only, never the seeded accounts.
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocal &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const TIMEOUT = 120_000;

// Table names are data here (the matrix below), so the client is deliberately untyped.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Untyped = SupabaseClient<any, any, any>;

const tag = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function anonClient(): Untyped {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

async function createUser(role: "admin" | "carer" | "family", organisationId: string | null) {
  const admin = createAdminClient();
  const email = `f0-21-${role}-${tag()}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    role,
    organisation_id: organisationId,
    first_name: "Test",
    last_name: role,
    email,
  });
  if (profileError) throw profileError;
  return { id: data.user.id, email };
}

async function signedIn(email: string): Promise<Untyped> {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return client;
}

/** Two organisations, each with an admin, a carer on shift with its own client, and a family. */
async function seed() {
  const admin = createAdminClient();
  const t = tag();
  const [{ data: orgA }, { data: orgB }] = await Promise.all([
    admin
      .from("organisations")
      .insert({ name: `F0-21 Org A ${t}` })
      .select("id")
      .single(),
    admin
      .from("organisations")
      .insert({ name: `F0-21 Org B ${t}` })
      .select("id")
      .single(),
  ]);
  if (!orgA || !orgB) throw new Error("seed: organisations");

  const [adminA, adminB, carerA, carerB, familyA, familyB] = await Promise.all([
    createUser("admin", orgA.id),
    createUser("admin", orgB.id),
    createUser("carer", orgA.id),
    createUser("carer", orgB.id),
    createUser("family", null),
    createUser("family", null),
  ]);

  const { data: clients } = await admin
    .from("clients")
    .insert([
      { organisation_id: orgA.id, first_name: "Clara", last_name: `A ${t}` },
      { organisation_id: orgB.id, first_name: "Colin", last_name: `B ${t}` },
    ])
    .select("id, organisation_id");
  const clientA = clients!.find((c) => c.organisation_id === orgA.id)!.id;
  const clientB = clients!.find((c) => c.organisation_id === orgB.id)!.id;

  await admin.from("client_family_members").insert([
    { client_id: clientA, profile_id: familyA.id },
    { client_id: clientB, profile_id: familyB.id },
  ]);
  const now = Date.now();
  await admin.from("shifts").insert([
    {
      organisation_id: orgA.id,
      client_id: clientA,
      carer_id: carerA.id,
      starts_at: new Date(now - 3_600_000).toISOString(),
      ends_at: new Date(now + 7_200_000).toISOString(),
    },
    {
      organisation_id: orgB.id,
      client_id: clientB,
      carer_id: carerB.id,
      starts_at: new Date(now - 3_600_000).toISOString(),
      ends_at: new Date(now + 7_200_000).toISOString(),
    },
  ]);
  await admin
    .from("client_info_sections")
    .insert({ client_id: clientA, key: "description", body: "A only" });

  const eventStart = new Date(Math.floor((now - 86_400_000) / 1000) * 1000).toISOString();
  const { data: event } = await admin
    .from("care_events")
    .insert({ client_id: clientA, title: "A event", starts_at: eventStart, created_by: familyA.id })
    .select("id")
    .single();
  await admin
    .from("care_event_overrides")
    .insert({
      event_id: event!.id,
      client_id: clientA,
      original_start: eventStart,
      kind: "modified",
      new_duration_minutes: 20,
    });
  await admin.from("care_event_completions").insert({
    event_id: event!.id,
    client_id: clientA,
    original_start: eventStart,
    action: "done",
    actor_id: familyA.id,
    actor_display_name: "Test family",
  });
  const { data: bucket } = await admin
    .from("budget_buckets")
    .insert({ client_id: clientA, name: "Core" })
    .select("id")
    .single();
  await admin.from("budget_fund_entries").insert({
    bucket_id: bucket!.id,
    client_id: clientA,
    kind: "bucket_added",
    amount: 100,
    recorded_by: familyA.id,
    recorded_by_name: "Test family",
  });
  const documentId = crypto.randomUUID();
  const storagePath = `clients/${clientA}/${documentId}/plan.pdf`;
  const upload = await admin.storage
    .from("client-documents")
    .upload(storagePath, new Blob(["%PDF-1.4 test"], { type: "application/pdf" }), {
      contentType: "application/pdf",
    });
  if (upload.error) throw upload.error;
  await admin.from("documents").insert({
    id: documentId,
    client_id: clientA,
    storage_path: storagePath,
    filename: "plan.pdf",
    mime_type: "application/pdf",
    size_bytes: 13,
    uploaded_by: familyA.id,
  });

  return {
    orgA: orgA.id,
    orgB: orgB.id,
    adminA,
    adminB,
    carerA,
    carerB,
    familyA,
    familyB,
    clientA,
    clientB,
    eventA: event!.id,
    eventStart,
    bucketA: bucket!.id,
    documentId,
    storagePath,
  };
}
type Seed = Awaited<ReturnType<typeof seed>>;

/** Every client-scoped table, how to find client A's rows in it, and a harmless change to try. */
function matrix(s: Seed, attackerId: string) {
  const soon = new Date(Date.now() + 86_400_000).toISOString();
  const later = new Date(Date.now() + 90_000_000).toISOString();
  const second = new Date(Math.floor(Date.now() / 1000) * 1000).toISOString();
  return [
    {
      table: "clients",
      col: "id",
      val: s.clientA,
      update: { first_name: "Hacked" },
      insert: { organisation_id: s.orgA, first_name: "X", last_name: "Y" },
    },
    {
      table: "client_family_members",
      col: "client_id",
      val: s.clientA,
      update: { relationship_label: "Hacked" },
      insert: { client_id: s.clientA, profile_id: attackerId },
    },
    {
      table: "client_info_sections",
      col: "client_id",
      val: s.clientA,
      update: { body: "Hacked", updated_by: attackerId },
      insert: { client_id: s.clientA, key: "habits", body: "x", updated_by: attackerId },
    },
    {
      table: "shifts",
      col: "client_id",
      val: s.clientA,
      update: { ends_at: soon },
      insert: {
        organisation_id: s.orgA,
        client_id: s.clientA,
        carer_id: s.carerA.id,
        starts_at: soon,
        ends_at: later,
      },
    },
    {
      table: "care_events",
      col: "client_id",
      val: s.clientA,
      update: { title: "Hacked" },
      insert: { client_id: s.clientA, title: "x", starts_at: second, created_by: attackerId },
    },
    {
      table: "care_event_overrides",
      col: "client_id",
      val: s.clientA,
      update: { new_duration_minutes: 1 },
      insert: {
        event_id: s.eventA,
        client_id: s.clientA,
        original_start: second,
        kind: "cancelled",
        created_by: attackerId,
      },
    },
    {
      table: "care_event_completions",
      col: "client_id",
      val: s.clientA,
      update: { action: "undone" },
      insert: {
        event_id: s.eventA,
        client_id: s.clientA,
        original_start: s.eventStart,
        action: "undone",
        actor_id: attackerId,
        actor_display_name: "x",
      },
    },
    {
      table: "budget_buckets",
      col: "client_id",
      val: s.clientA,
      update: { name: "Hacked" },
      insert: { client_id: s.clientA, name: "Mine" },
    },
    {
      table: "budget_fund_entries",
      col: "client_id",
      val: s.clientA,
      update: { note: "Hacked" },
      insert: {
        bucket_id: s.bucketA,
        client_id: s.clientA,
        kind: "funds_removed",
        amount: -50,
        recorded_by: attackerId,
        recorded_by_name: "x",
      },
    },
    {
      table: "budget_costs",
      col: "client_id",
      val: s.clientA,
      update: { note: "Hacked" },
      insert: {
        bucket_id: s.bucketA,
        client_id: s.clientA,
        original_start: second,
        description: "x",
        amount: 50,
        status: "pending",
        incurred_on: second.slice(0, 10),
        recorded_by: attackerId,
        recorded_by_name: "x",
      },
    },
    {
      table: "documents",
      col: "client_id",
      val: s.clientA,
      update: { detached_at: second },
      insert: {
        client_id: s.clientA,
        storage_path: `clients/${s.clientA}/${crypto.randomUUID()}/x.pdf`,
        filename: "x.pdf",
        mime_type: "application/pdf",
        size_bytes: 1,
        uploaded_by: attackerId,
      },
    },
    {
      table: "carer_notifications",
      col: "client_id",
      val: s.clientA,
      update: { read_at: second },
      insert: {
        recipient_id: s.carerA.id,
        source: "admin",
        kind: "shift_cancelled",
        message: "Spoofed",
        client_id: s.clientA,
      },
    },
    {
      table: "organisations",
      col: "id",
      val: s.orgA,
      update: { name: "Hacked" },
      insert: { name: "Spoofed org" },
    },
    {
      table: "profiles",
      col: "organisation_id",
      val: s.orgA,
      update: { first_name: "Hacked" },
      insert: { id: attackerId, role: "admin", organisation_id: s.orgA },
    },
    {
      table: "audit_log",
      col: "client_id",
      val: s.clientA,
      update: { action: "DELETE" },
      insert: {
        actor_role: "admin",
        table_name: "clients",
        action: "DELETE",
        client_id: s.clientA,
      },
    },
  ] as const;
}

/** Client A's rows on every table, read with the service role: the before/after picture. */
async function snapshot(s: Seed): Promise<string> {
  const admin = createAdminClient() as unknown as Untyped;
  const parts: unknown[] = [];
  for (const { table, col, val } of matrix(s, s.familyB.id)) {
    const { data } = await admin.from(table).select("*").eq(col, val).order(col);
    parts.push([table, JSON.stringify(data ?? [], Object.keys((data ?? [])[0] ?? {}).sort())]);
  }
  const { data: objects } = await admin.storage
    .from("client-documents")
    .list(`clients/${s.clientA}/${s.documentId}`);
  parts.push(["storage", (objects ?? []).map((o) => o.name).sort()]);
  return JSON.stringify(parts);
}

/** Tables where `client` saw any of client A's rows. */
async function visibleTables(client: Untyped, s: Seed, selfId: string): Promise<string[]> {
  const seen: string[] = [];
  for (const { table, col, val } of matrix(s, selfId)) {
    let query = client.from(table).select("*").eq(col, val);
    if (table === "profiles") query = query.neq("id", selfId);
    const { data } = await query;
    if (data && data.length > 0) seen.push(table);
  }
  const listed = await client.storage
    .from("client-documents")
    .list(`clients/${s.clientA}/${s.documentId}`);
  if ((listed.data ?? []).length > 0) seen.push("storage.list");
  const signed = await client.storage.from("client-documents").createSignedUrl(s.storagePath, 60);
  if (signed.data?.signedUrl) seen.push("storage.signedUrl");
  return seen;
}

/** Tries every write; returns the tables where one was accepted (expected: none). */
async function acceptedWrites(client: Untyped, s: Seed, attackerId: string): Promise<string[]> {
  const accepted: string[] = [];
  for (const { table, col, val, update, insert } of matrix(s, attackerId)) {
    const ins = await client.from(table).insert(insert).select();
    if (!ins.error && (ins.data ?? []).length > 0) accepted.push(`${table}:insert`);
    // A user editing their own profile is allowed (profiles_update_self); only others' rows count.
    const notSelf = <T extends { neq: (c: string, v: string) => T }>(q: T) =>
      table === "profiles" ? q.neq("id", attackerId) : q;
    const upd = await notSelf(client.from(table).update(update).eq(col, val)).select();
    if (!upd.error && (upd.data ?? []).length > 0) accepted.push(`${table}:update`);
    const del = await notSelf(client.from(table).delete().eq(col, val)).select();
    if (!del.error && (del.data ?? []).length > 0) accepted.push(`${table}:delete`);
  }
  const up = await client.storage
    .from("client-documents")
    .upload(
      `clients/${s.clientA}/${crypto.randomUUID()}/x.pdf`,
      new Blob(["%PDF"], { type: "application/pdf" }),
      { contentType: "application/pdf" },
    );
  if (!up.error) accepted.push("storage:upload");
  const rm = await client.storage.from("client-documents").remove([s.storagePath]);
  if (!rm.error && (rm.data ?? []).length > 0) accepted.push("storage:remove");
  return accepted;
}

/** Functions a client-A outsider might call with client A's ids (expected: all refused). */
async function acceptedRpcs(client: Untyped, s: Seed): Promise<string[]> {
  const window = {
    p_from: new Date(Date.now() - 86_400_000).toISOString(),
    p_to: new Date(Date.now() + 86_400_000).toISOString(),
  };
  const calls: [string, Record<string, unknown>][] = [
    ["add_bucket", { p_client_id: s.clientA, p_name: `Mine ${tag()}`, p_starting_amount: 0 }],
    ["add_funds", { p_bucket_id: s.bucketA, p_amount: 1 }],
    ["remove_funds", { p_bucket_id: s.bucketA, p_amount: 1 }],
    ["rename_bucket", { p_bucket_id: s.bucketA, p_name: "Mine" }],
    ["remove_bucket", { p_bucket_id: s.bucketA }],
    ["set_event_cost", { p_event_id: s.eventA, p_cost: 5, p_bucket_id: s.bucketA }],
    ["set_occurrence_done", { p_event_id: s.eventA, p_original_start: s.eventStart }],
    ["set_occurrence_undone", { p_event_id: s.eventA, p_original_start: s.eventStart }],
    ["client_shift_carers", { p_client_id: s.clientA, ...window }],
    ["transfer_client_organisation", { p_client_id: s.clientA, p_new_org_id: s.orgB }],
    ["list_organisations_for_transfer", { p_client_id: s.clientA }],
    [
      "admin_update_staff",
      {
        p_profile_id: s.carerA.id,
        p_first_name: "x",
        p_last_name: "y",
        p_phone: "0400000000",
        p_email: "x@example.test",
        p_job_title: "Carer",
      },
    ],
    ["get_carer_shifts", { p_carer_id: s.carerA.id, p_from: window.p_from, p_to: window.p_to }],
  ];
  const accepted: string[] = [];
  for (const [name, args] of calls) {
    const { data, error } = await client.rpc(name, args);
    const empty = data === null || (Array.isArray(data) && data.length === 0);
    if (!error && !empty) accepted.push(name);
  }
  const summary = await client.rpc("budget_bucket_summary", { p_client_id: s.clientA });
  if ((summary.data ?? []).length > 0) accepted.push("budget_bucket_summary");
  return accepted;
}

// --- route-level helpers (the same server code the pages run) ---------------------------------
function cookieClient(jar: Map<string, string>) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
        setAll: (list) => list.forEach(({ name, value }) => jar.set(name, value)),
      },
    },
  );
}

async function cookieSession(email: string, aal2 = false) {
  const jar = new Map<string, string>();
  const client = cookieClient(jar);
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  if (aal2) await stepUpToAal2(client);
  return jar;
}

async function withSession<T>(jar: Map<string, string>, run: () => Promise<T>): Promise<T> {
  vi.resetModules();
  vi.doMock("next/headers", () => ({
    cookies: async () => ({
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      set: (name: string, value: string) => jar.set(name, value),
    }),
    headers: async () => new Headers({ host: "127.0.0.1:3000", "x-forwarded-proto": "http" }),
  }));
  vi.stubEnv("DATA_SOURCE", "supabase");
  try {
    return await run();
  } finally {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  }
}

async function redirectTarget(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    const digest = (error as { digest?: string }).digest ?? "";
    expect(digest).toMatch(/^NEXT_REDIRECT;/);
    return digest.split(";")[2]!;
  }
  throw new Error("expected a redirect");
}

async function authUserExists(email: string): Promise<boolean> {
  const { data } = await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 1000 });
  return data.users.some((u) => u.email === email);
}

describe.skipIf(!hasLocalSupabase)("[F0-21] auth security audit against local Supabase", () => {
  let s: Seed;

  beforeAll(async () => {
    s = await seed();
  }, TIMEOUT);

  afterAll(async () => {
    // Best effort: ledger, completion and document rows are append-only by design, so the
    // organisations and clients stay; the users (and so every session) are removed.
    if (!s) return;
    const admin = createAdminClient();
    for (const u of [s.adminA, s.adminB, s.carerA, s.carerB, s.familyA, s.familyB]) {
      await admin.auth.admin.deleteUser(u.id).catch(() => undefined);
    }
  }, TIMEOUT);

  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  // ---------------------------------------------------------------------------------------------
  // AC-01 (T-01)
  // ---------------------------------------------------------------------------------------------
  it(
    "[F0-21][AC-01] T-01 an admin signed in with a password only reads and writes nothing of her organisation's through the API; after TOTP she can",
    async () => {
      const before = await snapshot(s);
      const admin = await signedIn(s.adminA.email);

      const { data: aal } = await admin.auth.mfa.getAuthenticatorAssuranceLevel();
      expect(aal?.currentLevel).toBe("aal1");

      expect(await visibleTables(admin, s, s.adminA.id)).toEqual([]);
      expect(await acceptedWrites(admin, s, s.adminA.id)).toEqual([]);
      expect(await acceptedRpcs(admin, s)).toEqual([]);
      const org = await admin.rpc("admin_update_organisation", {
        p_name: "Hijacked",
        p_abn: "54123456789",
        p_phone: "03 9555 0102",
        p_address: "1 High St",
      });
      expect(org.error?.code).toBe("42501");
      // Her own profile stays readable, so the route guard can send her to /mfa/verify.
      const self = await admin.from("profiles").select("id, role").eq("id", s.adminA.id);
      expect(self.data).toEqual([{ id: s.adminA.id, role: "admin" }]);
      expect(await snapshot(s)).toBe(before);

      await stepUpToAal2(admin);
      const { data: aal2 } = await admin.auth.mfa.getAuthenticatorAssuranceLevel();
      expect(aal2?.currentLevel).toBe("aal2");
      expect(await visibleTables(admin, s, s.adminA.id)).toEqual([
        "clients",
        "client_family_members",
        "client_info_sections",
        "shifts",
        "care_events",
        "care_event_overrides",
        "care_event_completions",
        "budget_buckets",
        "budget_fund_entries",
        "documents",
        "organisations",
        "profiles",
        "storage.list",
        "storage.signedUrl",
      ]);
      const summary = await admin.rpc("budget_bucket_summary", { p_client_id: s.clientA });
      expect(summary.data?.length).toBe(1);
    },
    TIMEOUT,
  );

  it(
    "[F0-21][AC-01] T-01 family and carer are never gated: their password-only sessions read their client",
    async () => {
      const family = await signedIn(s.familyA.email);
      const carer = await signedIn(s.carerA.email);
      for (const client of [family, carer]) {
        const { data } = await client.from("clients").select("id").eq("id", s.clientA);
        expect(data).toEqual([{ id: s.clientA }]);
      }
    },
    TIMEOUT,
  );

  // ---------------------------------------------------------------------------------------------
  // AC-03 (T-03): swapped ids, through the data API
  // ---------------------------------------------------------------------------------------------
  it.each([
    ["another organisation's admin (AAL2)", "adminB", true],
    ["another family", "familyB", false],
    ["another organisation's carer, on shift with their own client", "carerB", false],
  ] as const)(
    "[F0-21][AC-03] T-03 %s cannot read, insert, update or delete client A's rows on any client-scoped table",
    async (_, who, aal2) => {
      const before = await snapshot(s);
      const attacker = await signedIn(s[who].email);
      if (aal2) await stepUpToAal2(attacker);

      expect(await visibleTables(attacker, s, s[who].id)).toEqual([]);
      expect(await acceptedWrites(attacker, s, s[who].id)).toEqual([]);
      expect(await acceptedRpcs(attacker, s)).toEqual([]);
      expect(await snapshot(s)).toBe(before);
    },
    TIMEOUT,
  );

  // ---------------------------------------------------------------------------------------------
  // AC-03 (T-04, integration half): the route guards the /family/[clientId] and /admin pages run
  // ---------------------------------------------------------------------------------------------
  it(
    "[F0-21][AC-03] T-04 another family opening /family/<client A> is sent to their own client",
    async () => {
      const jar = await cookieSession(s.familyB.email);
      const target = await withSession(jar, async () => {
        const { assertClientAccess } = await import("@/server/clients/queries");
        return redirectTarget(() => assertClientAccess(s.clientA));
      });
      expect(target).toBe(`/family/${s.clientB}/home`);
    },
    TIMEOUT,
  );

  it(
    "[F0-21][AC-03] T-04 a family member or carer opening /admin is sent to their own home",
    async () => {
      for (const [user, home] of [
        [s.familyB, `/family/${s.clientB}/home`],
        [s.carerB, "/carer/home"],
      ] as const) {
        const jar = await cookieSession(user.email);
        const target = await withSession(jar, async () => {
          const { getCurrentUser } = await import("@/server/auth/queries");
          return redirectTarget(() => getCurrentUser("admin"));
        });
        expect(target).toBe(home);
      }
    },
    TIMEOUT,
  );

  it(
    "[F0-21][AC-03] T-04 an admin opening /admin pages sees only her organisation's clients, never client A",
    async () => {
      const jar = await cookieSession(s.adminB.email, true);
      const data = await withSession(jar, async () => {
        const { getAdminClients } = await import("@/server/admin/clients-queries");
        const { getAdminManage } = await import("@/server/admin/manage-queries");
        return { clients: await getAdminClients(), manage: await getAdminManage() };
      });
      expect(JSON.stringify(data)).not.toContain(s.clientA);
      expect(JSON.stringify(data)).toContain(s.clientB);
    },
    TIMEOUT,
  );

  // ---------------------------------------------------------------------------------------------
  // AC-03 (T-03): the staff invite Server Action uses the service role, so it must check the
  // caller is an admin (with TOTP) before it creates any account.
  // ---------------------------------------------------------------------------------------------
  it.each([
    ["a family member", "familyB", false],
    ["a carer", "carerB", false],
    ["an admin who has not completed TOTP", "adminB", false],
  ] as const)(
    "[F0-21][AC-03] T-03 %s calling createStaff directly is refused and no account is created",
    async (_, who, aal2) => {
      const email = `f0-21-invite-${tag()}@example.test`;
      const jar = await cookieSession(s[who].email, aal2);
      const result = await withSession(jar, async () => {
        const { createStaff } = await import("@/server/admin/staff-actions");
        return createStaff({
          firstName: "Eve",
          lastName: "Intruder",
          phone: "0400 000 000",
          email,
          jobTitle: "Carer",
        });
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("NOT_ALLOWED");
      expect(await authUserExists(email)).toBe(false);
    },
    TIMEOUT,
  );

  it(
    "[F0-21][AC-03] T-03 an admin with TOTP still invites a carer into her own organisation",
    async () => {
      const email = `f0-21-invite-${tag()}@example.test`;
      const jar = await cookieSession(s.adminA.email, true);
      const result = await withSession(jar, async () => {
        const { createStaff } = await import("@/server/admin/staff-actions");
        return createStaff({
          firstName: "Nia",
          lastName: "New",
          phone: "0400 000 000",
          email,
          jobTitle: "Carer",
        });
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data.organisationId).toBe(s.orgA);
    },
    TIMEOUT,
  );
});
