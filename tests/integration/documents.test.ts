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

describe.skipIf(!hasLocalSupabase)("[F0-13] documents", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
  });

  it("[F0-13][AC-01] Helen uploads Care plan.pdf for Margaret: a documents row and the object both exist under Margaret's path", async () => {
    const helen = await seedFamily("Margaret");
    try {
      const cookieStore = await signedInSession(helen.email);
      const formData = new FormData();
      formData.set("clientId", helen.clientId);
      formData.set("file", new File([PDF_BYTES], "Care plan.pdf", { type: "application/pdf" }));

      const outcome = await withCookieClient(cookieStore, async () => {
        const { uploadDocument } = await import("@/server/documents/actions");
        return uploadDocument(formData);
      });

      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;
      expect(outcome.data.storagePath).toBe(
        `clients/${helen.clientId}/${outcome.data.documentId}/Care plan.pdf`,
      );

      const { data: row } = await documentsAdmin()
        .select("*")
        .eq("id", outcome.data.documentId)
        .single();
      expect(row).toMatchObject({
        client_id: helen.clientId,
        filename: "Care plan.pdf",
        mime_type: "application/pdf",
        size_bytes: PDF_BYTES.length,
        uploaded_by: helen.userId,
        detached_at: null,
      });

      const admin = createAdminClient();
      const { data: listed } = await admin.storage
        .from("client-documents")
        .list(`clients/${helen.clientId}/${outcome.data.documentId}`);
      expect(listed?.map((entry) => entry.name)).toEqual(["Care plan.pdf"]);
    } finally {
      await cleanUp(helen.userId, helen.clientId);
    }
  });

  it("[F0-13][AC-02] a signed URL for that document expires in 60 seconds and actually resolves the file", async () => {
    const helen = await seedFamily("Margaret");
    try {
      const cookieStore = await signedInSession(helen.email);
      const formData = new FormData();
      formData.set("clientId", helen.clientId);
      formData.set("file", new File([PDF_BYTES], "Care plan.pdf", { type: "application/pdf" }));

      const documentId = await withCookieClient(cookieStore, async () => {
        const { uploadDocument } = await import("@/server/documents/actions");
        const result = await uploadDocument(formData);
        if (!result.ok) throw new Error(result.error.message);
        return result.data.documentId;
      });

      const outcome = await withCookieClient(cookieStore, async () => {
        const { getDocumentUrl } = await import("@/server/documents/actions");
        return getDocumentUrl(documentId);
      });

      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;
      expect(outcome.data.expiresInSeconds).toBe(60);
      expect(outcome.data.url).toContain("/storage/v1/object/sign/client-documents/");

      const response = await fetch(outcome.data.url);
      expect(response.status).toBe(200);
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(PDF_BYTES);
    } finally {
      await cleanUp(helen.userId, helen.clientId);
    }
  });

  it("[F0-13][AC-02] an unknown or inaccessible document id gets a not-found result, not an error", async () => {
    const helen = await seedFamily("Margaret");
    try {
      const cookieStore = await signedInSession(helen.email);

      const outcome = await withCookieClient(cookieStore, async () => {
        const { getDocumentUrl } = await import("@/server/documents/actions");
        return getDocumentUrl("00000000-0000-0000-0000-000000000000");
      });

      expect(outcome).toEqual({
        ok: false,
        error: { code: "NOT_FOUND", message: "Couldn't find that document." },
      });
    } finally {
      await cleanUp(helen.userId, helen.clientId);
    }
  });

  it("[F0-13][AC-03] a disallowed file type is rejected with a plain-language message and nothing is stored", async () => {
    const helen = await seedFamily("Margaret");
    try {
      const cookieStore = await signedInSession(helen.email);
      const formData = new FormData();
      formData.set("clientId", helen.clientId);
      formData.set(
        "file",
        new File([new Uint8Array([0x4d, 0x5a, 0, 0])], "not-a-document.exe", {
          type: "application/x-msdownload",
        }),
      );

      const outcome = await withCookieClient(cookieStore, async () => {
        const { uploadDocument } = await import("@/server/documents/actions");
        return uploadDocument(formData);
      });

      expect(outcome.ok).toBe(false);
      if (outcome.ok) return;
      expect(outcome.error.code).toBe("VALIDATION");
      expect(outcome.error.message).toMatch(/isn't supported/);

      const { count } = await documentsAdmin()
        .select("id", { count: "exact", head: true })
        .eq("client_id", helen.clientId);
      expect(count).toBe(0);

      const admin = createAdminClient();
      const { data: listed } = await admin.storage
        .from("client-documents")
        .list(`clients/${helen.clientId}`);
      expect(listed ?? []).toEqual([]);
    } finally {
      await cleanUp(helen.userId, helen.clientId);
    }
  });

  it("[F0-13][AC-05] a detached document is excluded from the event's active documents but the row and object still exist", async () => {
    const helen = await seedFamily("Margaret");
    try {
      const eventId = await seedEvent(helen.clientId, helen.userId);
      const cookieStore = await signedInSession(helen.email);
      const formData = new FormData();
      formData.set("clientId", helen.clientId);
      formData.set("eventId", eventId);
      formData.set(
        "file",
        new File([PDF_BYTES], "Medication chart.pdf", { type: "application/pdf" }),
      );

      const documentId = await withCookieClient(cookieStore, async () => {
        const { uploadDocument } = await import("@/server/documents/actions");
        const result = await uploadDocument(formData);
        if (!result.ok) throw new Error(result.error.message);
        return result.data.documentId;
      });

      const activeBefore = await documentsAdmin()
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .is("detached_at", null);
      expect(activeBefore.count).toBe(1);

      const outcome = await withCookieClient(cookieStore, async () => {
        const { detachDocument } = await import("@/server/documents/actions");
        return detachDocument(documentId);
      });
      expect(outcome).toEqual({ ok: true, data: undefined });

      const { data: row } = await documentsAdmin().select("*").eq("id", documentId).single();
      expect(row.detached_at).not.toBeNull();

      const activeAfter = await documentsAdmin()
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .is("detached_at", null);
      expect(activeAfter.count).toBe(0);

      const admin = createAdminClient();
      const { data: listed } = await admin.storage
        .from("client-documents")
        .list(`clients/${helen.clientId}/${documentId}`);
      expect(listed?.map((entry) => entry.name)).toEqual(["Medication chart.pdf"]);
    } finally {
      await cleanUp(helen.userId, helen.clientId);
    }
  });

  it("[F0-13][PRD] DATA_SOURCE=mock reports documents as not available rather than trying to write fixtures", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    try {
      const { uploadDocument, getDocumentUrl, detachDocument } = await import(
        "@/server/documents/actions"
      );
      const formData = new FormData();
      formData.set("clientId", "00000000-0000-0000-0000-000000000000");
      formData.set("file", new File([PDF_BYTES], "x.pdf", { type: "application/pdf" }));

      expect(await uploadDocument(formData)).toEqual({
        ok: false,
        error: { code: "NOT_AVAILABLE", message: "Documents are not available yet." },
      });
      expect(await getDocumentUrl("00000000-0000-0000-0000-000000000000")).toEqual({
        ok: false,
        error: { code: "NOT_AVAILABLE", message: "Documents are not available yet." },
      });
      expect(await detachDocument("00000000-0000-0000-0000-000000000000")).toEqual({
        ok: false,
        error: { code: "NOT_AVAILABLE", message: "Documents are not available yet." },
      });
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
