// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

import { createServerClient } from "@supabase/ssr";
import { describe, expect, it } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { NO_CLIENT_LINKED_PATH } from "@/server/auth/routing";
import type { Role } from "@/types/domain";

import { totpCode } from "../helpers/totp";

// Imported dynamically (inside the functions below) rather than at module
// scope: `@/server/jobs/supabase-admin` throws at import time when Supabase
// env vars aren't set (`src/lib/env.ts`), which would crash this whole file
// — including the route-coverage tests below, that need no live stack at all.

// Requires a running local Supabase stack (`supabase start`) and `.env.local`
// populated from `supabase status` — same convention as F0-07's
// shared-authentication integration test. Skips cleanly wherever that isn't
// set up; the static route-coverage test below still runs regardless.
const hasLocalSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const PASSWORD = "correct horse battery staple 1!";

function uniqueEmail(label: string): string {
  return `int-05-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

async function createProfile(
  role: Role,
  opts: { organisationId?: string | null } = {},
): Promise<{ userId: string; email: string; password: string }> {
  const { createAdminClient } = await import("@/server/jobs/supabase-admin");
  const admin = createAdminClient();
  const email = uniqueEmail(role);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw error ?? new Error("failed to create the integration test user");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    role,
    organisation_id: opts.organisationId ?? null,
    first_name: "Test",
    last_name: role,
    is_active: true,
  });
  if (profileError) throw profileError;

  return { userId: data.user.id, email, password: PASSWORD };
}

async function deleteUser(userId: string): Promise<void> {
  const { createAdminClient } = await import("@/server/jobs/supabase-admin");
  await createAdminClient().auth.admin.deleteUser(userId);
}

async function createOrganisation(): Promise<string> {
  const { createAdminClient } = await import("@/server/jobs/supabase-admin");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organisations")
    .insert({ name: `INT-05 Test Org ${Date.now()}` })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("failed to create the test organisation");
  return data.id;
}

/**
 * Enrols and verifies a TOTP factor so an admin test profile reaches AAL2
 * (OQ-08) — otherwise the MFA gate in `resolveActiveProfile` redirects to
 * `/mfa/enroll` before the role-mismatch check this test targets ever runs.
 * Same enroll → challenge → verify sequence as F0-07's AC-10 test.
 */
async function verifyAdminMfa(client: ReturnType<typeof cookieClient>): Promise<void> {
  const { data: enrolled, error: enrollError } = await client.auth.mfa.enroll({
    factorType: "totp",
  });
  if (enrollError || !enrolled) throw enrollError ?? new Error("enroll returned no data");

  const challenge = await client.auth.mfa.challenge({ factorId: enrolled.id });
  if (challenge.error || !challenge.data) {
    throw challenge.error ?? new Error("challenge returned no data");
  }
  const verify = await client.auth.mfa.verify({
    factorId: enrolled.id,
    challengeId: challenge.data.id,
    code: totpCode(enrolled.totp.secret),
  });
  if (verify.error) throw verify.error;
}

/** A real `@supabase/ssr` client backed by an in-memory cookie jar, standing in for the browser's cookies. */
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

const DASHBOARD_HOME: Record<Role, string> = {
  admin: "/admin/home",
  carer: "/carer/home",
  // No linked client is created for the family test profile, so the guard
  // sends it to the no-client-linked page rather than a specific client's home.
  family: NO_CLIENT_LINKED_PATH,
};

const ALL_ROLES: Role[] = ["family", "carer", "admin"];

describe.skipIf(!hasLocalSupabase)("[INT-05] access-control regression matrix — behaviour", () => {
  it.each(
    ALL_ROLES.flatMap((actor) =>
      ALL_ROLES.filter((other) => other !== actor).map((otherDashboard) => ({
        actor,
        otherDashboard,
      })),
    ),
  )(
    "[INT-05][AC-02] a signed-in $actor requesting the $otherDashboard dashboard is redirected",
    async ({ actor, otherDashboard }) => {
      const organisationId = actor === "family" ? null : await createOrganisation();
      const profile = await createProfile(actor, { organisationId });
      try {
        const cookieStore = new Map<string, string>();
        const client = cookieClient(cookieStore);
        const { error } = await client.auth.signInWithPassword(profile);
        expect(error).toBeNull();
        if (actor === "admin") await verifyAdminMfa(client);

        const { evaluateRoleGuard } = await import("@/server/auth/guard");
        const outcome = await evaluateRoleGuard(client, otherDashboard);

        expect(outcome).toEqual({ action: "redirect", to: DASHBOARD_HOME[actor] });
      } finally {
        await deleteUser(profile.userId);
      }
    },
  );
});

/**
 * Static companion to the behavioural matrix above: proves every dashboard
 * page actually sits under a layout that calls `getCurrentUser` for its
 * role, rather than hand-listing routes that could drift from the
 * filesystem. A page added under a route group with no guarding ancestor
 * layout — or a layout that stops calling the guard — fails this test
 * without needing a live Supabase stack, the same enumerate-don't-list
 * approach as T-01's RLS catalog check.
 */
describe("[INT-05] access-control regression matrix — route coverage", () => {
  const appRoot = join(process.cwd(), "src/app");
  const roleGroups: { dir: string; role: Role }[] = [
    { dir: join(appRoot, "(admin)"), role: "admin" },
    { dir: join(appRoot, "(carer)"), role: "carer" },
    { dir: join(appRoot, "(family)"), role: "family" },
  ];

  function findPageFiles(dir: string): string[] {
    const found: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        found.push(...findPageFiles(full));
      } else if (entry === "page.tsx") {
        found.push(full);
      }
    }
    return found;
  }

  function guardsRole(source: string, role: Role): boolean {
    return (
      new RegExp(`getCurrentUser\\(\\s*["']${role}["']`).test(source) ||
      new RegExp(`evaluateRoleGuard\\([^)]*["']${role}["']`).test(source)
    );
  }

  /** Every `layout.tsx` from `pageDir` up to (and including) `groupDir`. */
  function ancestorLayouts(pageDir: string, groupDir: string): string[] {
    const layouts: string[] = [];
    let current = pageDir;
    for (;;) {
      const candidate = join(current, "layout.tsx");
      try {
        if (statSync(candidate).isFile()) layouts.push(candidate);
      } catch {
        // no layout at this level — fine, keep walking up
      }
      if (current === groupDir) break;
      current = dirname(current);
    }
    return layouts;
  }

  for (const { dir, role } of roleGroups) {
    const pages = findPageFiles(dir);

    it(`[INT-05][AC-02] every ${role} dashboard page is guarded (${pages.length} pages found)`, () => {
      expect(pages.length).toBeGreaterThan(0);

      const unguarded = pages.filter((pagePath) => {
        const filesToCheck = [pagePath, ...ancestorLayouts(dirname(pagePath), dir)];
        return !filesToCheck.some((file) => guardsRole(readFileSync(file, "utf-8"), role));
      });

      expect(unguarded).toEqual([]);
    });
  }
});
