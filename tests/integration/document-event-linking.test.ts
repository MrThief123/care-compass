// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`, migrations applied — the
// Storage API, not only the database, so `supabase db start` alone is not enough). Needs
// this feature's migration (`documents`, the `client-documents` bucket), so these tests run
// only when NEXT_PUBLIC_SUPABASE_URL is a local address and skip against a hosted project,
// the same convention as F0-11's, FAM-12's, FAM-13's and F0-17's integration tests. If
// `.env.local` points at a hosted project, override the three variables from
// `npx supabase status -o env` for the run.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0, 0, 0, 0]);

function unique(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** A real `@supabase/ssr` client backed by an in-memory cookie jar (the browser's cookies). */
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

/** Runs `run` with `next/headers` mocked onto `cookieStore` (F0-07's technique). */
async function withCookieClient<T>(
  cookieStore: Map<string, string>,
  run: () => Promise<T>,
): Promise<T> {
  const asCookieList = () => [...cookieStore.entries()].map(([name, value]) => ({ name, value }));
  vi.resetModules();
  vi.doMock("next/headers", () => ({
    cookies: async () => ({
      getAll: asCookieList,
      set: (name: string, value: string) => cookieStore.set(name, value),
    }),
  }));
  vi.stubEnv("DATA_SOURCE", "supabase");
  try {
    return await run();
  } finally {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  }
}

/** `documents` is not in the generated types yet (FD, same reasoning as `src/server/documents/db.ts`). */
function documentsAdmin() {
  const admin = createAdminClient();
  return (admin.from as unknown as (table: string) => any)("documents"); // eslint-disable-line @typescript-eslint/no-explicit-any
}

async function seedFamily(clientFirstName: string) {
  const admin = createAdminClient();
  const email = `f0-13-${unique(clientFirstName.toLowerCase())}@example.test`;
  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (userError || !created.user) throw userError ?? new Error("failed to create test user");

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: created.user.id, role: "family", first_name: "Test", last_name: "Family" });
  if (profileError) throw profileError;

  const { data: client, error: clientError } = await admin
    .from("clients")
    .insert({ first_name: clientFirstName, last_name: unique("Client"), organisation_id: null })
    .select("id")
    .single();
  if (clientError || !client) throw clientError ?? new Error("failed to create test client");

  const { error: linkError } = await admin
    .from("client_family_members")
    .insert({ client_id: client.id, profile_id: created.user.id });
  if (linkError) throw linkError;

  return { userId: created.user.id, email, clientId: client.id as string };
}

async function seedEvent(clientId: string, createdBy: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("care_events")
    .insert({
      client_id: clientId,
      title: "Morning medication",
      starts_at: new Date(Math.floor(Date.now() / 1000) * 1000).toISOString(),
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("failed to create test event");
  return data.id as string;
}

async function signedInSession(email: string) {
  const cookieStore = new Map<string, string>();
  const client = cookieClient(cookieStore);
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return cookieStore;
}

async function cleanUp(userId: string, clientId: string) {
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);
  // The append-only trigger forbids deleting a documents row (by design); nothing to undo
  // there. Storage objects and the client are cleaned up so re-runs start fresh.
  await admin.storage
    .from("client-documents")
    .list(`clients/${clientId}`)
    .then(({ data }) =>
      data?.length
        ? admin.storage
            .from("client-documents")
            .remove(data.map((entry) => `clients/${clientId}/${entry.name}`))
        : null,
    );
}

async function seedSecondFamily(clientId: string) {
  const admin = createAdminClient();
  const email = `f0-23-${unique("rosa")}@example.test`;
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !created.user) throw error ?? new Error("failed to create test user");
  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: created.user.id, role: "family", first_name: "Rosa", last_name: "Other" });
  if (profileError) throw profileError;
  return { userId: created.user.id, email, clientId };
}

async function uploadAs(cookieStore: Map<string, string>, clientId: string, name: string) {
  const formData = new FormData();
  formData.set("clientId", clientId);
  formData.set("file", new File([PDF_BYTES], name, { type: "application/pdf" }));
  return withCookieClient(cookieStore, async () => {
    const { uploadDocument } = await import("@/server/documents/actions");
    const result = await uploadDocument(formData);
    if (!result.ok) throw new Error(result.error.message);
    return result.data.documentId;
  });
}

describe.skipIf(!hasLocalSupabase)("[F0-23] link uploaded documents to a new event", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
  });

  it("[F0-23][AC-01][AC-06] Helen uploads with no event, saves the event, links the file, and the event's document row carries the event id", async () => {
    const helen = await seedFamily("Margaret");
    try {
      const cookieStore = await signedInSession(helen.email);
      const documentId = await uploadAs(cookieStore, helen.clientId, "Physio referral.pdf");
      const eventId = await seedEvent(helen.clientId, helen.userId);

      const outcome = await withCookieClient(cookieStore, async () => {
        const { linkDocumentsToEvent } = await import("@/server/documents/actions");
        return linkDocumentsToEvent({ eventId, documentIds: [documentId] });
      });

      expect(outcome).toEqual({ ok: true, data: { failedIds: [] } });
      const { data: row } = await documentsAdmin().select("*").eq("id", documentId).single();
      expect(row).toMatchObject({
        client_id: helen.clientId,
        event_id: eventId,
        filename: "Physio referral.pdf",
        uploaded_by: helen.userId,
        detached_at: null,
      });
    } finally {
      await cleanUp(helen.userId, helen.clientId);
    }
  });

  it("[F0-23][AC-03] linking the same document again is reported as failed and the first link stands", async () => {
    const helen = await seedFamily("Margaret");
    try {
      const cookieStore = await signedInSession(helen.email);
      const documentId = await uploadAs(cookieStore, helen.clientId, "Care plan.pdf");
      const first = await seedEvent(helen.clientId, helen.userId);
      const second = await seedEvent(helen.clientId, helen.userId);

      const outcomes = await withCookieClient(cookieStore, async () => {
        const { linkDocumentsToEvent } = await import("@/server/documents/actions");
        return [
          await linkDocumentsToEvent({ eventId: first, documentIds: [documentId] }),
          await linkDocumentsToEvent({ eventId: second, documentIds: [documentId] }),
        ];
      });

      expect(outcomes[0]).toEqual({ ok: true, data: { failedIds: [] } });
      expect(outcomes[1]).toEqual({ ok: true, data: { failedIds: [documentId] } });
      const { data: row } = await documentsAdmin().select("event_id").eq("id", documentId).single();
      expect(row.event_id).toBe(first);
    } finally {
      await cleanUp(helen.userId, helen.clientId);
    }
  });

  it("[F0-23][AC-02][AC-05] another family member cannot link Helen's upload to Helen's event", async () => {
    const helen = await seedFamily("Margaret");
    const rosa = await seedSecondFamily(helen.clientId);
    try {
      const helenSession = await signedInSession(helen.email);
      const documentId = await uploadAs(helenSession, helen.clientId, "Care plan.pdf");
      const eventId = await seedEvent(helen.clientId, helen.userId);
      const rosaSession = await signedInSession(rosa.email);

      const outcome = await withCookieClient(rosaSession, async () => {
        const { linkDocumentsToEvent } = await import("@/server/documents/actions");
        return linkDocumentsToEvent({ eventId, documentIds: [documentId] });
      });

      expect(outcome).toEqual({ ok: true, data: { failedIds: [documentId] } });
      const { data: row } = await documentsAdmin().select("event_id").eq("id", documentId).single();
      expect(row.event_id).toBeNull();
    } finally {
      await cleanUp(rosa.userId, helen.clientId);
      await cleanUp(helen.userId, helen.clientId);
    }
  });

  it("[F0-23][AC-04] an event of another client is refused", async () => {
    const helen = await seedFamily("Margaret");
    const robert = await seedFamily("Robert");
    try {
      const cookieStore = await signedInSession(helen.email);
      const documentId = await uploadAs(cookieStore, helen.clientId, "Care plan.pdf");
      const robertsEvent = await seedEvent(robert.clientId, robert.userId);

      const outcome = await withCookieClient(cookieStore, async () => {
        const { linkDocumentsToEvent } = await import("@/server/documents/actions");
        return linkDocumentsToEvent({ eventId: robertsEvent, documentIds: [documentId] });
      });

      expect(outcome).toEqual({ ok: true, data: { failedIds: [documentId] } });
      const { data: row } = await documentsAdmin().select("event_id").eq("id", documentId).single();
      expect(row.event_id).toBeNull();
    } finally {
      await cleanUp(robert.userId, robert.clientId);
      await cleanUp(helen.userId, helen.clientId);
    }
  });
});
