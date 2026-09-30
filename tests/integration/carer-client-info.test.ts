// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// [CAR-04] Info read/save/upload against a real database: read follows shifts (PD-041, F0-18), writes
// need a shift in progress (this feature's migration). Needs a running local Supabase stack (`supabase start`,
// migrations applied); runs only when NEXT_PUBLIC_SUPABASE_URL is a local address and skips
// against a hosted project. If `.env.local` points at a hosted project, override the three
// variables from `supabase status -o env` for the run.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const HOUR = 3_600_000;

function unique(label: string) {
  return `car-04-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createUser(label: string, role: "family" | "carer", organisationId: string | null) {
  const admin = createAdminClient();
  const email = `${unique(label)}@example.test`;
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
    first_name: label,
    last_name: "Test",
  });
  if (profileError) throw profileError;
  return { userId: data.user.id, email };
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

async function signedInAs(email: string) {
  const cookieStore = new Map<string, string>();
  const { error } = await cookieClient(cookieStore).auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  expect(error).toBeNull();
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

const at = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();
const SHIFT_ENDED = "Your shift has ended, so changes can't be saved.";
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0, 0, 0, 0]);

/**
 * Banksia holds Aisha, Helen's client Margaret (Aisha's shift is in progress), Robert (Aisha has
 * only a later shift) and Walter (Aisha has no shift with him).
 */
async function seed() {
  const admin = createAdminClient();
  const org = await admin
    .from("organisations")
    .insert({ name: unique("banksia") })
    .select("id")
    .single();
  if (org.error || !org.data) throw org.error ?? new Error("org");
  const aisha = await createUser("aisha", "carer", org.data.id);
  const helen = await createUser("helen", "family", null);

  const clients = await admin
    .from("clients")
    .insert(
      ["Margaret", "Robert", "Walter"].map((first) => ({
        first_name: first,
        last_name: "Test",
        organisation_id: org.data.id,
        suburb: "Preston VIC",
      })),
    )
    .select("id, first_name");
  if (clients.error || clients.data?.length !== 3) throw clients.error ?? new Error("clients");
  const id = (first: string) => clients.data.find((c) => c.first_name === first)!.id;

  const shifts = await admin.from("shifts").insert([
    { client_id: id("Margaret"), carer_id: aisha.userId, starts_at: at(-HOUR), ends_at: at(HOUR) },
    {
      client_id: id("Robert"),
      carer_id: aisha.userId,
      starts_at: at(3 * HOUR),
      ends_at: at(5 * HOUR),
    },
  ]);
  if (shifts.error) throw shifts.error;

  // Helen's own habits text for Margaret, so "the carer's edit replaces it" is observable.
  const family = await admin.from("client_family_members").insert({
    client_id: id("Margaret"),
    profile_id: helen.userId,
    relationship_label: "Daughter",
  });
  if (family.error) throw family.error;
  const sections = await admin.from("client_info_sections").insert([
    {
      client_id: id("Margaret"),
      key: "medical_history",
      body: "Hip replacement.",
      updated_by: helen.userId,
    },
    { client_id: id("Margaret"), key: "habits", body: "Tea at 7am.", updated_by: helen.userId },
    {
      client_id: id("Margaret"),
      key: "description",
      body: "Lives alone.",
      updated_by: helen.userId,
    },
  ]);
  if (sections.error) throw sections.error;

  return { admin, orgId: org.data.id, aisha, helen, id, ids: clients.data };
}

async function cleanUp(s: Awaited<ReturnType<typeof seed>>) {
  for (const user of [s.aisha, s.helen]) await s.admin.auth.admin.deleteUser(user.userId);
  await s.admin
    .from("clients")
    .delete()
    .in(
      "id",
      s.ids.map((c) => c.id),
    );
  await s.admin.from("organisations").delete().eq("id", s.orgId);
}

async function asAisha<T>(s: Awaited<ReturnType<typeof seed>>, run: () => Promise<T>) {
  return withSession(await signedInAs(s.aisha.email), run);
}

describe.skipIf(!hasLocalSupabase)("[CAR-04] carer client info against local Supabase", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
  });

  it("[CAR-04][AC-08] reads the sections in order and the client's documents oldest first, leaving out detached ones", async () => {
    const s = await seed();
    try {
      const doc = (name: string, uploadedAt: string, detached = false) => ({
        client_id: s.id("Margaret"),
        filename: name,
        mime_type: "application/pdf",
        size_bytes: 10,
        storage_path: `clients/${s.id("Margaret")}/${crypto.randomUUID()}/${name}`,
        uploaded_by: s.helen.userId,
        uploaded_at: uploadedAt,
        detached_at: detached ? at(0) : null,
      });
      const inserted = await s.admin
        .from("documents")
        .insert([
          doc("Second.pdf", "2026-09-02T00:00:00Z"),
          doc("First.pdf", "2026-09-01T00:00:00Z"),
          doc("Gone.pdf", "2026-09-03T00:00:00Z", true),
        ]);
      expect(inserted.error).toBeNull();

      const { sections, documents } = await asAisha(s, async () => {
        const { getClientInfoSections } = await import("@/server/clients/queries");
        const { getClientDocuments } = await import("@/server/documents/queries");
        return {
          sections: await getClientInfoSections(s.id("Margaret")),
          documents: await getClientDocuments(s.id("Margaret")),
        };
      });

      expect(sections.map((x) => x.kind)).toEqual(["description", "habits", "medicalHistory"]);
      expect(documents.map((d) => d.name)).toEqual(["First.pdf", "Second.pdf"]);
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-04][AC-02] an on-shift carer's save is stored, read back, and recorded as hers", async () => {
    const s = await seed();
    try {
      const result = await asAisha(s, async () => {
        const { saveClientInfoSection } = await import("@/server/clients/actions");
        return saveClientInfoSection(s.id("Margaret"), "habits", "Tea at 6am, then a walk.");
      });
      expect(result).toEqual({ ok: true, data: undefined });

      const row = await s.admin
        .from("client_info_sections")
        .select("body, updated_by")
        .eq("client_id", s.id("Margaret"))
        .eq("key", "habits")
        .single();
      expect(row.data).toEqual({ body: "Tea at 6am, then a walk.", updated_by: s.aisha.userId });
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-04][AC-03][AC-05] off shift (Robert) the save is refused with the shift-ended message and nothing is written", async () => {
    const s = await seed();
    try {
      const result = await asAisha(s, async () => {
        const { saveClientInfoSection } = await import("@/server/clients/actions");
        return saveClientInfoSection(s.id("Robert"), "habits", "Sneaky");
      });

      expect(result).toEqual({ ok: false, error: { code: "NOT_ALLOWED", message: SHIFT_ENDED } });
      const rows = await s.admin
        .from("client_info_sections")
        .select("body")
        .eq("client_id", s.id("Robert"));
      expect(rows.data).toEqual([]);
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-04][AC-04] a client she has no shift with (Walter): nothing is read and nothing can be saved", async () => {
    const s = await seed();
    try {
      await s.admin
        .from("client_info_sections")
        .insert({ client_id: s.id("Walter"), key: "habits", body: "Private." });
      const { sections, documents, save } = await asAisha(s, async () => {
        const { getClientInfoSections } = await import("@/server/clients/queries");
        const { getClientDocuments } = await import("@/server/documents/queries");
        const { saveClientInfoSection } = await import("@/server/clients/actions");
        return {
          sections: await getClientInfoSections(s.id("Walter")),
          documents: await getClientDocuments(s.id("Walter")),
          save: await saveClientInfoSection(s.id("Walter"), "habits", "Sneaky"),
        };
      });

      expect(sections).toEqual([]);
      expect(documents).toEqual([]);
      expect(save.ok).toBe(false);
    } finally {
      await cleanUp(s);
    }
  });

  it("[CAR-04][AC-07] on shift she uploads a file and it lists; off shift the upload is refused", async () => {
    const s = await seed();
    try {
      const form = (clientId: string) => {
        const data = new FormData();
        data.set("clientId", clientId);
        data.set("file", new File([PDF], "Diet sheet.pdf", { type: "application/pdf" }));
        return data;
      };

      const { onShift, offShift, listed } = await asAisha(s, async () => {
        const { uploadDocument } = await import("@/server/documents/actions");
        const { getClientDocuments } = await import("@/server/documents/queries");
        return {
          onShift: await uploadDocument(form(s.id("Margaret"))),
          offShift: await uploadDocument(form(s.id("Robert"))),
          listed: await getClientDocuments(s.id("Margaret")),
        };
      });

      expect(onShift.ok).toBe(true);
      expect(offShift.ok).toBe(false);
      if (!offShift.ok) expect(offShift.error.code).toBe("NOT_ALLOWED");
      expect(listed.map((d) => d.name)).toEqual(["Diet sheet.pdf"]);
      expect(listed[0]!.uploadedBy).toBe("aisha Test");
    } finally {
      await cleanUp(s);
    }
  });
});
