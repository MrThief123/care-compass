// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

import { stepUpIfAdmin } from "../helpers/aal2";

// ADM-03. Requires a running local Supabase stack (`supabase start`, migrations applied). Skips
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
  return `adm-03-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

  return { admin, orgId: org.data.id, priya, marcus, helen, clientId: client.data.id };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const userId of [s.priya.userId, s.marcus.userId, s.helen.userId]) {
    await s.admin.auth.admin.deleteUser(userId);
  }
  await s.admin.from("clients").delete().eq("id", s.clientId);
  await s.admin.from("organisations").delete().eq("id", s.orgId);
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

describe.skipIf(!hasLocalSupabase)(
  "[ADM-03] Admin — Deactivate staff against local Supabase",
  () => {
    afterEach(() => {
      vi.doUnmock("next/headers");
      vi.unstubAllEnvs();
    });

    it("[ADM-03][AC-03] T-10 Priya deactivates Marcus; getAdminStaff reports him inactive and his future shift is cancelled", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.priya.email);

        const outcome = await withSession(cookieStore, async () => {
          const { deactivateStaff } = await import("@/server/admin/staff-actions");
          return deactivateStaff(s.marcus.userId);
        });
        expect(outcome).toMatchObject({
          ok: true,
          data: { id: s.marcus.userId, firstName: "Marcus", lastName: "Chen", isActive: false },
        });

        const list = await withSession(cookieStore, async () => {
          const { getAdminStaff } = await import("@/server/admin/staff-queries");
          return getAdminStaff();
        });
        expect(list.staff.find((person) => person.id === s.marcus.userId)).toMatchObject({
          isActive: false,
        });

        const shifts = await s.admin
          .from("shifts")
          .select("starts_at, ends_at, cancelled_at")
          .eq("carer_id", s.marcus.userId);
        const future = shifts.data?.filter((row) => new Date(row.starts_at) > new Date());
        expect(future).toHaveLength(1);
        expect(future?.[0]?.cancelled_at).not.toBeNull();
      } finally {
        await cleanUp(s);
      }
    });

    it("[ADM-03][AC-04] T-10 a carer's session cannot deactivate a colleague; nothing changes", async () => {
      const s = await seed();
      const daniel = await createUser("Daniel", "Kelly", "carer", s.orgId);
      try {
        const { cookieStore } = await signIn(daniel.email);

        const outcome = await withSession(cookieStore, async () => {
          const { deactivateStaff } = await import("@/server/admin/staff-actions");
          return deactivateStaff(s.marcus.userId);
        });

        expect(outcome).toMatchObject({ ok: false, error: { code: "NOT_ALLOWED" } });
        const marcus = await s.admin
          .from("profiles")
          .select("is_active")
          .eq("id", s.marcus.userId)
          .single();
        expect(marcus.data?.is_active).toBe(true);
      } finally {
        await s.admin.auth.admin.deleteUser(daniel.userId);
        await cleanUp(s);
      }
    });

    it("[ADM-03][AC-02] T-02 Marcus's earlier completions still show his name in the family task log", async () => {
      const s = await seed();
      try {
        // CHG-032: the log shows the full name stored at completion time, so it reads
        // 'Done · Marcus Chen' (AC-02's 'Marcus C.' predates that change).
        const start = new Date(
          Math.floor((Date.now() - 3 * 24 * HOUR) / 1000) * 1000,
        ).toISOString();
        const title = unique("morning-meds");
        const event = await s.admin
          .from("care_events")
          .insert({ client_id: s.clientId, title, starts_at: start, duration_minutes: 15 })
          .select("id")
          .single();
        if (event.error || !event.data) throw event.error ?? new Error("event");
        const completion = await s.admin.from("care_event_completions").insert({
          event_id: event.data.id,
          client_id: s.clientId,
          original_start: start,
          action: "done",
          actor_id: s.marcus.userId,
          actor_display_name: "Marcus Chen",
          organisation_id: s.orgId,
        });
        expect(completion.error).toBeNull();

        const priya = await signIn(s.priya.email);
        const outcome = await withSession(priya.cookieStore, async () => {
          const { deactivateStaff } = await import("@/server/admin/staff-actions");
          return deactivateStaff(s.marcus.userId);
        });
        expect(outcome.ok).toBe(true);

        const helen = await signIn(s.helen.email);
        const log = await withSession(helen.cookieStore, async () => {
          const { getTaskLog } = await import("@/server/events/queries");
          return getTaskLog(s.clientId, { q: title });
        });
        expect(log.items).toEqual([
          expect.objectContaining({ status: "done", actor: "Marcus Chen" }),
        ]);
      } finally {
        await s.admin.from("care_event_completions").delete().eq("client_id", s.clientId);
        await cleanUp(s);
      }
    });

    it("[ADM-03][AC-06] T-06 a carer signed in before deactivation reads nothing and is signed out on the next request", async () => {
      const s = await seed();
      try {
        const marcus = await signIn(s.marcus.email);
        const { evaluateRoleGuard } = await import("@/server/auth/guard");
        expect(await evaluateRoleGuard(marcus.client, "carer")).toMatchObject({ action: "allow" });
        expect((await marcus.client.from("clients").select("id")).data).toHaveLength(1);

        const priya = await signIn(s.priya.email);
        const outcome = await withSession(priya.cookieStore, async () => {
          const { deactivateStaff } = await import("@/server/admin/staff-actions");
          return deactivateStaff(s.marcus.userId);
        });
        expect(outcome.ok).toBe(true);

        // Same session, next request: no clients, and the route guard sends him to sign-in.
        expect((await marcus.client.from("clients").select("id")).data).toEqual([]);
        expect(await evaluateRoleGuard(marcus.client, "carer")).toEqual({
          action: "redirect",
          to: "/sign-in?reason=inactive",
        });
      } finally {
        await cleanUp(s);
      }
    });
  },
);
