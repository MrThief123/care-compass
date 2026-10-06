import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/lib/supabase/database.types";

export const SCALE_PASSWORD = "int07-local-synthetic-only-1!";
export const SCALE_ORG = "07000000-0000-4000-8000-000000000001";
export const SCALE_EMAIL = "int07-family@example.test";
const id = (prefix: string, index: number) =>
  `${prefix}-0000-4000-8000-${String(index).padStart(12, "0")}`;

export function assertLocalUrl(value: string): void {
  const url = new URL(value);
  if (
    url.protocol !== "http:" ||
    !["localhost", "127.0.0.1"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    !url.port
  ) {
    throw new Error("INT-07 only permits a loopback HTTP Supabase URL with an explicit port.");
  }
}

export function percentile95(samples: number[]): number {
  if (!samples.length || samples.some((value) => !Number.isFinite(value) || value < 0))
    throw new Error("Finite nonnegative samples required");
  return [...samples].sort((a, b) => a - b)[Math.ceil(samples.length * 0.95) - 1]!;
}

export function buildScaleRows() {
  const frequencies = ["daily", "weekly", "monthly", "yearly"] as const;
  const clients = Array.from({ length: 50 }, (_, index) => ({
    id: id("07100000", index + 1),
    organisation_id: SCALE_ORG,
    first_name: "Scale",
    last_name: `Client ${String(index + 1).padStart(2, "0")}`,
  }));
  const events = clients.flatMap((client, clientIndex) =>
    Array.from({ length: 500 }, (_, eventIndex) => ({
      id: id("07200000", clientIndex * 500 + eventIndex + 1),
      client_id: client.id,
      title: `Scale care ${String(eventIndex + 1).padStart(3, "0")}`,
      starts_at: `2016-01-04T09:${String(eventIndex % 60).padStart(2, "0")}:00+11:00`,
      duration_minutes: 30,
      recurrence: { frequency: frequencies[eventIndex % 4]!, interval: 1 },
      completion_mode: "manual" as const,
      created_at: "2016-01-04T00:00:00Z",
    })),
  );
  return { clients, events };
}

export function localAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  assertLocalUrl(url);
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Local service role key required");
  return createClient<Database>(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function ensureScaleSeed() {
  const db = localAdmin();
  const rows = buildScaleRows();
  const existing = await db.from("organisations").select("name").eq("id", SCALE_ORG).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data && existing.data.name !== "INT-07 synthetic scale")
    throw new Error("Reserved scale namespace is already owned by other data");
  if (!existing.data) {
    const result = await db
      .from("organisations")
      .insert({ id: SCALE_ORG, name: "INT-07 synthetic scale" });
    if (result.error) throw result.error;
  }
  const existingClients = await db
    .from("clients")
    .select("id,organisation_id")
    .in(
      "id",
      rows.clients.map((client) => client.id),
    );
  if (existingClients.error) throw existingClients.error;
  if (existingClients.data.some((client) => client.organisation_id !== SCALE_ORG)) {
    throw new Error("Reserved scale client IDs belong to a different organisation");
  }
  const clientResult = await db
    .from("clients")
    .upsert(rows.clients, { onConflict: "id", ignoreDuplicates: true });
  if (clientResult.error) throw clientResult.error;
  let profileId: string;
  const profile = await db
    .from("profiles")
    .select("id,role,first_name")
    .eq("email", SCALE_EMAIL)
    .maybeSingle();
  if (profile.error) throw profile.error;
  if (profile.data) {
    if (profile.data.role !== "family" || profile.data.first_name !== "INT07")
      throw new Error("Reserved scale account has unexpected ownership");
    profileId = profile.data.id;
  } else {
    const user = await db.auth.admin.createUser({
      email: SCALE_EMAIL,
      password: SCALE_PASSWORD,
      email_confirm: true,
    });
    if (user.error) throw user.error;
    profileId = user.data.user.id;
    const inserted = await db.from("profiles").insert({
      id: profileId,
      email: SCALE_EMAIL,
      role: "family",
      first_name: "INT07",
      last_name: "Family",
      organisation_id: null,
    });
    if (inserted.error) throw inserted.error;
  }
  const clientId = rows.clients[0]!.id;
  const membership = await db
    .from("client_family_members")
    .upsert(
      { client_id: clientId, profile_id: profileId },
      { onConflict: "client_id,profile_id", ignoreDuplicates: true },
    );
  if (membership.error) throw membership.error;
  for (let start = 0; start < rows.events.length; start += 500) {
    const result = await db.from("care_events").upsert(
      rows.events.slice(start, start + 500).map((row) => ({ ...row, created_by: profileId })),
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (result.error) throw result.error;
  }
  for (const client of rows.clients) {
    const count = await db
      .from("care_events")
      .select("id", { head: true, count: "exact" })
      .eq("client_id", client.id);
    if (count.error || count.count !== 500)
      throw new Error(`Scale fixture incomplete: expected 500 events for ${client.id}`);
  }
  return {
    organisationId: SCALE_ORG,
    clientId,
    familyId: profileId,
    familyEmail: SCALE_EMAIL,
    clientCount: 50,
    eventsPerClient: 500,
    eventCount: 25_000,
    anchorYear: 2016,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.loadEnvFile(".env.local");
  ensureScaleSeed()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : "Scale seeding failed");
      process.exitCode = 1;
    });
}
