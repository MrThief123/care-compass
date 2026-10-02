// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

import { stepUpIfAdmin } from "../helpers/aal2";

// ADM-05. Requires a running local Supabase stack (`supabase start`, migrations applied). Skips
// against a hosted project, exactly as tests/integration/admin-staff.test.ts does.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const HOUR = 60 * 60 * 1000;

function unique(label: string) {
  return `adm-05-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(
  firstName: string,
  lastName: string,
  role: "family" | "carer" | "admin",
  organisationId: string | null,
) {
  const admin = createAdminClient();
  const email = `${unique(firstName.toLowerCase())}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("failed to create the test user");
  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    role,
    organisation_id: organisationId,
    first_name: firstName,
    last_name: lastName,
    email,
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, email };
}

async function seed() {
  const admin = createAdminClient();
  const org = await admin
    .from("organisations")
    .insert({ name: unique("org") })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  const priya = await createUser("Priya", "Nair", "admin", org.data.id);
  const marcus = await createUser("Marcus", "Chen", "carer", org.data.id);
  const helen = await createUser("Helen", "Doyle", "family", null);

  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: unique("client"), organisation_id: org.data.id })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");
  await admin
    .from("client_family_members")
    .insert({ client_id: client.data.id, profile_id: helen.userId });

  // Marcus is on shift now, so he can read Margaret until he is deactivated.
  const iso = (offset: number) => new Date(Date.now() + offset).toISOString();
  const shifts = await admin.from("shifts").insert([
    {
      organisation_id: org.data.id,
      carer_id: marcus.userId,
      client_id: client.data.id,
      starts_at: iso(-1 * HOUR),
      ends_at: iso(2 * HOUR),
    },
    {
      organisation_id: org.data.id,
      carer_id: marcus.userId,
      client_id: client.data.id,
      starts_at: iso(24 * HOUR),
      ends_at: iso(28 * HOUR),
    },
  ]);
  if (shifts.error) throw shifts.error;

  const otherOrg = await admin
    .from("organisations")
    .insert({ name: unique("other-org") })
    .select("id")
    .single();
  if (otherOrg.error || !otherOrg.data) throw otherOrg.error ?? new Error("other org");

  return {
    admin,
    orgId: org.data.id,
    otherOrgId: otherOrg.data.id,
    priya,
    marcus,
    helen,
    clientId: client.data.id,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const userId of [s.priya.userId, s.marcus.userId, s.helen.userId]) {
    await s.admin.auth.admin.deleteUser(userId);
  }
  await s.admin.from("clients").delete().eq("id", s.clientId);
  await s.admin.from("shifts").delete().eq("client_id", s.clientId);
  await s.admin.from("care_events").delete().eq("client_id", s.clientId);
  await s.admin.from("organisations").delete().in("id", [s.orgId, s.otherOrgId]);
}

function cookieClient(cookieStore: Map<string, string>) {
  const asCookieList = () => [...cookieStore.entries()].map(([name, value]) => ({ name, value }));
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: asCookieList,
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value }) => cookieStore.set(name, value)),
      },
    },
  );
}

async function signIn(email: string) {
  const cookieStore = new Map<string, string>();
  const client = cookieClient(cookieStore);
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  expect(error).toBeNull();
  // F0-21: admin RLS needs an AAL2 session; family and carers are never stepped up.
  await stepUpIfAdmin(client);
  return { cookieStore, client };
}

async function withSession<T>(cookieStore: Map<string, string>, run: () => Promise<T>): Promise<T> {
  const asCookieList = () => [...cookieStore.entries()].map(([name, value]) => ({ name, value }));
  vi.resetModules();
  vi.doMock("next/headers", () => ({
    cookies: async () => ({
      getAll: asCookieList,
      set: (name: string, value: string) => cookieStore.set(name, value),
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

describe.skipIf(!hasLocalSupabase)("[ADM-05] Admin — Remove client against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[ADM-05][AC-10] Priya removes Margaret: her list drops her, Marcus reads nothing, Helen keeps everything and sees organisationRemoved", async () => {
    const s = await seed();
    try {
      const title = unique("physio");
      const event = await s.admin
        .from("care_events")
        .insert({
          client_id: s.clientId,
          title,
          starts_at: new Date(Math.floor((Date.now() + 2 * HOUR) / 1000) * 1000).toISOString(),
          duration_minutes: 30,
        })
        .select("id")
        .single();
      if (event.error || !event.data) throw event.error ?? new Error("event");

      const priya = await signIn(s.priya.email);
      const outcome = await withSession(priya.cookieStore, async () => {
        const { removeClient } = await import("@/server/admin/clients-actions");
        return removeClient(s.clientId);
      });
      expect(outcome).toEqual({ ok: true, data: { id: s.clientId } });

      const list = await withSession(priya.cookieStore, async () => {
        const { getAdminClients } = await import("@/server/admin/clients-queries");
        return getAdminClients();
      });
      expect(list.clients.find((client) => client.id === s.clientId)).toBeUndefined();

      const marcus = await signIn(s.marcus.email);
      const asMarcus = await marcus.client.from("clients").select("id").eq("id", s.clientId);
      expect(asMarcus.data).toEqual([]);

      const helen = await signIn(s.helen.email);
      const asHelen = await helen.client.from("clients").select("id").eq("id", s.clientId);
      expect(asHelen.data).toEqual([{ id: s.clientId }]);
      const events = await helen.client
        .from("care_events")
        .select("id")
        .eq("client_id", s.clientId);
      expect(events.data).toEqual([{ id: event.data.id }]);

      const header = await withSession(helen.cookieStore, async () => {
        const { getClientHeaderSummary } = await import("@/server/clients/queries");
        return getClientHeaderSummary(s.clientId);
      });
      expect(header.organisationRemoved).toBe(true);
      expect(header.organisationName).toBeUndefined();

      // Marcus's future shift is cancelled, the one running now has ended.
      const shifts = await s.admin
        .from("shifts")
        .select("starts_at, ends_at, cancelled_at")
        .eq("client_id", s.clientId);
      const future = shifts.data?.filter((row) => new Date(row.starts_at) > new Date());
      expect(future?.every((row) => row.cancelled_at !== null)).toBe(true);
      const running = shifts.data?.filter((row) => new Date(row.starts_at) <= new Date());
      expect(running?.every((row) => new Date(row.ends_at) <= new Date())).toBe(true);
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-05][AC-10] a carer's session cannot remove the client; nothing changes", async () => {
    const s = await seed();
    try {
      const marcus = await signIn(s.marcus.email);
      const outcome = await withSession(marcus.cookieStore, async () => {
        const { removeClient } = await import("@/server/admin/clients-actions");
        return removeClient(s.clientId);
      });

      expect(outcome).toMatchObject({ ok: false, error: { code: "NOT_ALLOWED" } });
      const row = await s.admin
        .from("clients")
        .select("organisation_id, organisation_removed_at")
        .eq("id", s.clientId)
        .single();
      expect(row.data).toEqual({ organisation_id: s.orgId, organisation_removed_at: null });
    } finally {
      await cleanUp(s);
    }
  });

  it("[ADM-05][AC-07] once Helen chooses a new organisation the banner clears and Marcus's old access stays gone", async () => {
    const s = await seed();
    try {
      const priya = await signIn(s.priya.email);
      await withSession(priya.cookieStore, async () => {
        const { removeClient } = await import("@/server/admin/clients-actions");
        return removeClient(s.clientId);
      });

      const helen = await signIn(s.helen.email);
      const moved = await withSession(helen.cookieStore, async () => {
        const { changeClientOrganisation } = await import("@/server/clients/actions");
        return changeClientOrganisation(s.clientId, s.otherOrgId);
      });
      expect(moved.ok).toBe(true);

      const header = await withSession(helen.cookieStore, async () => {
        const { getClientHeaderSummary } = await import("@/server/clients/queries");
        return getClientHeaderSummary(s.clientId);
      });
      expect(header.organisationRemoved).toBeFalsy();
      expect(header.organisationName).toBeDefined();

      const row = await s.admin
        .from("clients")
        .select("organisation_id, organisation_removed_at")
        .eq("id", s.clientId)
        .single();
      expect(row.data).toEqual({ organisation_id: s.otherOrgId, organisation_removed_at: null });
    } finally {
      await cleanUp(s);
    }
  });
});
