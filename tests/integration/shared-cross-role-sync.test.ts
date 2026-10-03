// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

import { stepUpIfAdmin } from "../helpers/aal2";

// Cross-role sync. A change made by family, a carer or an organisation admin must be what the other
// two read straight afterwards. Every write goes through the real Server Action and every read through
// the real contract function, each as that user's own session, so RLS applies on both sides.
// Requires the local Supabase stack, like the other integration tests.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const HOUR = 3_600_000;

type Role = "family" | "carer" | "admin";
const ROLES: Role[] = ["family", "carer", "admin"];
const NAMES: Record<Role, string> = {
  family: "Helen Doyle",
  carer: "Aisha Khan",
  admin: "Priya Nair",
};

function unique(label: string) {
  return `sync-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(
  firstName: string,
  lastName: string,
  role: Role,
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

  const users = {
    admin: await createUser("Priya", "Nair", "admin", org.data.id),
    carer: await createUser("Aisha", "Khan", "carer", org.data.id),
    family: await createUser("Helen", "Doyle", "family", null),
  };

  const client = await admin
    .from("clients")
    .insert({ first_name: "Margaret", last_name: unique("client"), organisation_id: org.data.id })
    .select("id")
    .single();
  if (client.error || !client.data) throw client.error ?? new Error("client");
  const clientId = client.data.id;
  await admin
    .from("client_family_members")
    .insert({ client_id: clientId, profile_id: users.family.userId });

  // A shift in progress, so the carer may write.
  const now = Date.now();
  const shift = await admin.from("shifts").insert({
    client_id: clientId,
    carer_id: users.carer.userId,
    starts_at: new Date(now - 6 * HOUR).toISOString(),
    ends_at: new Date(now + 6 * HOUR).toISOString(),
  });
  if (shift.error) throw shift.error;

  const bucket = await admin
    .from("budget_buckets")
    .insert({ client_id: clientId, name: "NDIS" })
    .select("id")
    .single();
  if (bucket.error || !bucket.data) throw bucket.error ?? new Error("bucket");
  await admin.from("budget_fund_entries").insert({
    bucket_id: bucket.data.id,
    client_id: clientId,
    kind: "funds_added",
    amount: 1000,
    recorded_by: users.family.userId,
    recorded_by_name: NAMES.family,
  });

  // One task per writer, due earlier today, for the tick check (event ids; the app builds the key).
  const keys = {} as Record<Role, string>;
  for (const [index, role] of ROLES.entries()) {
    const startsAt = new Date(Math.floor((now - (3 + index) * HOUR) / 1000) * 1000).toISOString();
    const event = await admin
      .from("care_events")
      .insert({
        client_id: clientId,
        title: unique(`task-${role}`),
        starts_at: startsAt,
        duration_minutes: 15,
        completion_mode: "manual",
        created_by: users.family.userId,
      })
      .select("id, starts_at")
      .single();
    if (event.error || !event.data) throw event.error ?? new Error("event");
    keys[role] = event.data.id;
  }

  return { admin, orgId: org.data.id, users, clientId, bucketId: bucket.data.id, keys };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const role of ROLES) await s.admin.auth.admin.deleteUser(s.users[role].userId);
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
  await stepUpIfAdmin(client);
  return cookieStore;
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

describe.skipIf(!hasLocalSupabase)("Cross-role sync against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it.each(ROLES)(
    "a change made by %s is what the other two roles read straight afterwards",
    async (writer) => {
      const s = await seed();
      try {
        const sessions = {} as Record<Role, Map<string, string>>;
        for (const role of ROLES) sessions[role] = await signIn(s.users[role].email);
        const as = <T>(role: Role, run: () => Promise<T>) => withSession(sessions[role], run);
        const others = ROLES.filter((role) => role !== writer);

        // 1. Client information (Habits).
        const habits = `${writer} says: prefers tea, no sugar.`;
        const saved = await as(writer, async () => {
          const { saveClientInfoSection } = await import("@/server/clients/actions");
          return saveClientInfoSection(s.clientId, "habits", habits);
        });
        expect(saved.ok, `${writer} saves info`).toBe(true);
        for (const reader of ROLES) {
          const sections = await as(reader, async () => {
            const { getClientInfoSections } = await import("@/server/clients/queries");
            return getClientInfoSections(s.clientId);
          });
          expect(
            sections.find((section) => section.kind === "habits")?.content,
            `${reader} reads ${writer}'s info`,
          ).toBe(habits);
        }

        // 2. A new event, then another role changes its title.
        const title = unique(`event-by-${writer}`);
        const created = await as(writer, async () => {
          const { createEvent } = await import("@/server/events/actions");
          return createEvent({
            clientId: s.clientId,
            title,
            description: "Created in the sync test",
            date: "2026-12-07",
            startTime: "10:00",
            durationMinutes: 30,
            recurrence: "none",
            isTask: true,
          });
        });
        expect(created.ok, `${writer} creates an event`).toBe(true);
        if (!created.ok) return;
        const eventId = created.data.eventId;
        for (const reader of ROLES) {
          const event = await as(reader, async () => {
            const { getEvent } = await import("@/server/events/queries");
            return getEvent(s.clientId, eventId);
          });
          expect(event?.title, `${reader} reads ${writer}'s new event`).toBe(title);
        }

        const editor = others[0]!;
        const retitled = `${title} (edited by ${editor})`;
        const original = await s.admin
          .from("care_events")
          .select("starts_at")
          .eq("id", eventId)
          .single();
        const edited = await as(editor, async () => {
          const { updateEvent } = await import("@/server/events/actions");
          return updateEvent({
            clientId: s.clientId,
            eventId,
            occurrenceOriginalStart: original.data!.starts_at,
            title: retitled,
            description: "Edited in the sync test",
            date: "2026-12-07",
            startTime: "10:00",
            durationMinutes: 30,
            recurrence: "none",
            isTask: true,
            scope: "series",
          });
        });
        expect(edited.ok, `${editor} edits ${writer}'s event`).toBe(true);
        for (const reader of ROLES) {
          const event = await as(reader, async () => {
            const { getEvent } = await import("@/server/events/queries");
            return getEvent(s.clientId, eventId);
          });
          expect(event?.title, `${reader} reads ${editor}'s edit`).toBe(retitled);
          expect(event?.description).toBe("Edited in the sync test");
        }

        // 3. Ticking a task: the others see it done, with the ticker's name.
        const key = await as("admin", async () => {
          const { getTodayOccurrences } = await import("@/server/events/queries");
          const today = await getTodayOccurrences(s.clientId);
          return today.find((occurrence) => occurrence.eventId === s.keys[writer])?.key ?? "";
        });
        expect(key, "the task is listed for today").not.toBe("");
        const ticked = await as(writer, async () => {
          const { setOccurrenceDone } = await import("@/server/events/actions");
          return setOccurrenceDone(key);
        });
        expect(ticked.ok, `${writer} ticks a task`).toBe(true);
        for (const reader of ROLES) {
          const occurrence = await as(reader, async () => {
            const { getOccurrence } = await import("@/server/events/queries");
            return getOccurrence(s.clientId, key);
          });
          expect(occurrence?.status, `${reader} sees ${writer}'s tick`).toBe("done");
          expect(occurrence?.actor, `${reader} sees who ticked`).toBe(NAMES[writer]);
        }

        // 4. Budget: family and admin edit it; a carer may not, and nothing changes for anyone.
        const budgetBefore = await as(writer, async () => {
          const { getBudgetSummary } = await import("@/server/budget/queries");
          return (await getBudgetSummary(s.clientId)).find((b) => b.id === s.bucketId)?.total;
        });
        const budget = await as(writer, async () => {
          const { saveBudgetEdit } = await import("@/server/budget/actions");
          return saveBudgetEdit(s.clientId, {
            buckets: [
              { id: s.bucketId, name: "NDIS", direction: "add", amount: 250, remove: false },
            ],
            added: [],
          });
        });
        const expectedTotal = writer === "carer" ? budgetBefore : (budgetBefore ?? 0) + 250;
        if (writer === "carer") expect(budget.ok, "a carer cannot edit the budget").toBe(false);
        else expect(budget.ok, `${writer} edits the budget`).toBe(true);
        for (const reader of ROLES) {
          const { total, history } = await as(reader, async () => {
            const { getBudgetSummary, getFundHistory } = await import("@/server/budget/queries");
            return {
              total: (await getBudgetSummary(s.clientId)).find((b) => b.id === s.bucketId)?.total,
              history: await getFundHistory(s.clientId),
            };
          });
          expect(total, `${reader} reads the budget after ${writer}'s edit`).toBe(expectedTotal);
          if (writer !== "carer") {
            expect(history.find((entry) => entry.amount === 250)?.recordedBy).toBe(NAMES[writer]);
          }
        }

        // 5. The task log lists the ticked task as done to every role.
        for (const reader of ROLES) {
          const log = await as(reader, async () => {
            const { getTaskLog } = await import("@/server/events/queries");
            return getTaskLog(s.clientId, { type: "all" });
          });
          const entry = log.items.find((item) => item.eventId === s.keys[writer]);
          expect(entry?.kind === "task" || entry?.kind === undefined, "a task").toBe(true);
          expect(
            entry && "status" in entry ? entry.status : undefined,
            `${reader}'s log shows ${writer}'s tick`,
          ).toBe("done");
        }
      } finally {
        await cleanUp(s);
      }
    },
    60_000,
  );
});
