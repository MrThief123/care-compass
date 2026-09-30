// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import { localToMelbourneIso } from "@/lib/dates/melbourne-time";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`, migrations applied). Skips against a
// hosted project, exactly as tests/integration/care-events.test.ts does — see its header comment
// for how to point this run at the local stack.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";

function unique(label: string) {
  return `fam-01-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(
  firstName: string,
  role: "family" | "carer" = "family",
  organisationId: string | null = null,
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
    last_name: role === "family" ? "Doyle" : "Rahman",
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, email };
}

/** Today in Melbourne, as a calendar date. */
const melbourneDate = (offsetDays = 0) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(
    new Date(Date.now() + offsetDays * 24 * 3_600_000),
  );

/** A Melbourne wall-clock time on a day, as an instant. */
const melbourneAt = (time: string, offsetDays = 0) =>
  new Date(localToMelbourneIso(`${melbourneDate(offsetDays)}T${time}:00`)).toISOString();

async function seed() {
  const admin = createAdminClient();
  const org = await admin
    .from("organisations")
    .insert({ name: unique("org") })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");

  const helen = await createUser("Helen");
  const rosa = await createUser("Rosa");
  const aisha = await createUser("Aisha", "carer", org.data.id);

  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: unique("client"), organisation_id: org.data.id })
    .select("id")
    .single();
  const other = await admin
    .from("clients")
    .insert({ first_name: "Robert", last_name: unique("client"), organisation_id: org.data.id })
    .select("id")
    .single();
  if (client.error || !client.data || other.error || !other.data) throw new Error("clients");

  await admin.from("client_family_members").insert([
    { client_id: client.data.id, profile_id: helen.userId },
    { client_id: other.data.id, profile_id: rosa.userId },
  ]);

  return {
    admin,
    orgId: org.data.id,
    helen,
    rosa,
    aisha,
    clientId: client.data.id,
    otherId: other.data.id,
  };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.helen, s.rosa, s.aisha]) await s.admin.auth.admin.deleteUser(user.userId);
  // Clients with history cannot be deleted (append-only completions): leave those, ignore the error.
  await s.admin.from("clients").delete().in("id", [s.clientId, s.otherId]);
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

async function todayAs(session: Map<string, string>, clientId: string) {
  return withSession(session, async () => {
    const { getTodayOccurrences } = await import("@/server/events/queries");
    return getTodayOccurrences(clientId);
  });
}

describe.skipIf(!hasLocalSupabase)(
  "[FAM-01] Family Home — Today timeline against local Supabase",
  () => {
    afterEach(() => {
      vi.doUnmock("next/headers");
      vi.unstubAllEnvs();
    });

    it("[FAM-01][AC-01][AC-02] returns only today's occurrences, oldest first, each assigned to the carer whose shift covers it", async () => {
      const s = await seed();
      try {
        const { client, cookieStore } = await signIn(s.helen.email);
        const created = await client.from("care_events").insert([
          {
            client_id: s.clientId,
            title: "Physiotherapy",
            starts_at: melbourneAt("11:30"),
            duration_minutes: 90,
          },
          {
            client_id: s.clientId,
            title: "Morning medication",
            starts_at: melbourneAt("09:00"),
            duration_minutes: 60,
          },
          {
            client_id: s.clientId,
            title: "Yesterday",
            starts_at: melbourneAt("10:00", -1),
            duration_minutes: 60,
          },
          {
            client_id: s.clientId,
            title: "Tomorrow",
            starts_at: melbourneAt("10:00", 1),
            duration_minutes: 60,
          },
        ]);
        expect(created.error).toBeNull();
        const shift = await s.admin.from("shifts").insert({
          client_id: s.clientId,
          carer_id: s.aisha.userId,
          starts_at: melbourneAt("08:00"),
          ends_at: melbourneAt("10:00"),
        });
        expect(shift.error).toBeNull();

        const rows = await todayAs(cookieStore, s.clientId);

        expect(rows.map((row) => row.title)).toEqual(["Morning medication", "Physiotherapy"]);
        expect(rows[0]).toMatchObject({ durationMinutes: 60, assignee: "Aisha Rahman" });
        // The shift ends at 10:00, so nobody covers 11:30 and no assignee is shown.
        expect(rows[1]).toMatchObject({ durationMinutes: 90 });
        expect(rows[1]).not.toHaveProperty("assignee");
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-01][AC-04] a client with nothing today gets an empty list", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.helen.email);
        await expect(todayAs(cookieStore, s.clientId)).resolves.toEqual([]);
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-01][AC-05] another client's family reads nothing of Margaret's day (RLS)", async () => {
      const s = await seed();
      try {
        const { client: helenClient } = await signIn(s.helen.email);
        await helenClient.from("care_events").insert({
          client_id: s.clientId,
          title: "Private",
          starts_at: melbourneAt("09:00"),
        });

        const { cookieStore: rosaSession } = await signIn(s.rosa.email);
        await expect(todayAs(rosaSession, s.clientId)).resolves.toEqual([]);
      } finally {
        await cleanUp(s);
      }
    });

    it("[FAM-01][AC-05] Helen is refused Robert's home and sent to her own landing page", async () => {
      const s = await seed();
      try {
        const { cookieStore } = await signIn(s.helen.email);
        const outcome = await withSession(cookieStore, async () => {
          const { assertClientAccess } = await import("@/server/clients/queries");
          return assertClientAccess(s.otherId).then(
            () => "allowed",
            (error: unknown) => String((error as { digest?: string }).digest ?? error),
          );
        });

        expect(outcome).toMatch(/^NEXT_REDIRECT/);
        expect(outcome).toContain(`/family/${s.clientId}`);
      } finally {
        await cleanUp(s);
      }
    });
  },
);
