import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import {
  addAppendOnlyRows,
  assertLocal,
  closeRoles,
  expect,
  journey,
  leftovers,
  openRoles,
  seedWorld,
  serviceClient,
  skipReason,
  waitForEmailLink,
} from "./support";

// INT-12 Phase 0 — harness (AC-01 to AC-03). Local stack only; see support.ts.
//   E2E_PORT=3150 E2E_DATA_SOURCE=supabase npm run test:journey -- --grep @phase-0

const LOCAL = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
  E2E_DATA_SOURCE: "supabase",
};

// These need no stack: they run everywhere, because they are what makes the rest safe to skip.
test.describe("[INT-12][AC-01] the guard", () => {
  test(
    "[INT-12][AC-01] T-01 a hosted URL, the mock data source or missing keys each give a reason",
    { tag: "@phase-0" },
    () => {
      expect(skipReason(LOCAL)).toBeNull();
      expect(
        skipReason({ ...LOCAL, NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co" }),
      ).toMatch(/not a local address/);
      expect(skipReason({ ...LOCAL, NEXT_PUBLIC_SUPABASE_URL: "" })).toMatch(/not a local address/);
      expect(
        skipReason({ ...LOCAL, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1.evil.example" }),
      ).toMatch(/not a local address/);
      expect(skipReason({ ...LOCAL, E2E_DATA_SOURCE: "mock" })).toMatch(/E2E_DATA_SOURCE=supabase/);
      expect(skipReason({ ...LOCAL, E2E_DATA_SOURCE: undefined })).toMatch(
        /E2E_DATA_SOURCE=supabase/,
      );
      expect(skipReason({ ...LOCAL, SUPABASE_SERVICE_ROLE_KEY: "" })).toMatch(/SERVICE_ROLE_KEY/);
    },
  );

  test(
    "[INT-12][AC-01] T-01 nothing is written when the guard refuses: no database client is even created",
    { tag: "@phase-0" },
    () => {
      const hosted = { ...LOCAL, NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co" };
      expect(() => assertLocal(hosted)).toThrow(/local/);
      expect(() => serviceClient(hosted)).toThrow(/local/);
    },
  );
});

test.describe("[INT-12][AC-03] how the suite is run", () => {
  const dir = join(process.cwd(), "tests/e2e/int-12");

  test(
    "[INT-12][AC-03] T-03 phase files sort in phase order, so one worker runs them in order",
    { tag: "@phase-0" },
    () => {
      const files = readdirSync(dir)
        .filter((name) => /^phase-\d-.+\.spec\.ts$/.test(name))
        .sort();
      const phases = files.map((name) => Number(/^phase-(\d)-/.exec(name)![1]));
      expect(phases).toEqual([...phases].sort((a, b) => a - b));
      expect(new Set(phases).size).toBe(phases.length);
      expect(files[0]).toBe("phase-0-harness.spec.ts");
    },
  );

  test(
    "[INT-12][AC-03] T-03 `test:journey --list` runs one worker, in order, and --grep @phase-0 lists only Phase 0",
    { tag: "@phase-0" },
    () => {
      const list = (...extra: string[]) =>
        JSON.parse(
          execFileSync(
            "npx",
            [
              "playwright",
              "test",
              "--config",
              "playwright.journey.config.ts",
              "--list",
              "--reporter=json",
              ...extra,
            ],
            { encoding: "utf8", env: { ...process.env, PW_TEST_HTML_REPORT_OPEN: "never" } },
          ),
        ) as { config: { workers: number }; suites: { file: string }[] };

      const all = list();
      expect(all.config.workers).toBe(1);
      const files = all.suites.map((suite) => suite.file);
      expect(files).toEqual([...files].sort());

      const only = list("--grep", "@phase-0");
      expect(only.suites.map((suite) => suite.file)).toEqual(["phase-0-harness.spec.ts"]);
    },
  );
});

// The rest need the local stack and skip with a reason otherwise (AC-01).
journey.describe.configure({ mode: "serial" });

const seededRunIds: { passed?: string; failed?: { runId: string; clientIds: string[] } } = {};

journey.describe("[INT-12][AC-02] seed and clean-up", () => {
  journey(
    "[INT-12][AC-02] T-02 seeds an organisation, admin with TOTP, carer, family and client, all marked",
    { tag: "@phase-0" },
    async ({ world }) => {
      seededRunIds.passed = world.runId;
      const db = serviceClient();

      const profiles = await db
        .from("profiles")
        .select("id, role, email")
        .like("email", `${world.marker}-%`);
      expect((profiles.data ?? []).map((p) => p.role).sort()).toEqual(["admin", "carer", "family"]);
      for (const person of [world.admin, world.carer, world.family]) {
        expect(person.email).toContain(world.marker);
      }
      expect(world.orgName).toBe(world.marker);

      const link = await db
        .from("client_family_members")
        .select("profile_id")
        .eq("client_id", world.client.id);
      expect(link.data).toEqual([{ profile_id: world.family.id }]);

      // The admin's TOTP factor is real and verified (the same API the app's own pages use).
      const anon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: { persistSession: false },
        },
      );
      await anon.auth.signInWithPassword({
        email: world.admin.email,
        password: "correct horse battery staple 1!",
      });
      const factors = await anon.auth.mfa.listFactors();
      expect(factors.data?.totp).toHaveLength(1);

      // Rows only the local clean-up can remove (append-only tables), so the next test proves it reaches them.
      await addAppendOnlyRows(world);
    },
  );

  journey(
    "[INT-12][AC-02] T-02 after a passing test nothing marked with its run id remains",
    { tag: "@phase-0" },
    async () => {
      expect(seededRunIds.passed, "the previous test ran").toBeTruthy();
      expect(await leftovers(seededRunIds.passed!)).toEqual([]);
    },
  );

  journey.fail(
    "[INT-12][AC-02] T-02 a test that FAILS still triggers clean-up (this one is meant to fail)",
    { tag: "@phase-0" },
    async ({ world }) => {
      seededRunIds.failed = { runId: world.runId, clientIds: [world.client.id] };
      await addAppendOnlyRows(world);
      throw new Error("forced failure: clean-up must still run");
    },
  );

  journey(
    "[INT-12][AC-02] T-02 after a failing test nothing marked with its run id remains",
    { tag: "@phase-0" },
    async () => {
      expect(seededRunIds.failed, "the failing test ran").toBeTruthy();
      expect(await leftovers(seededRunIds.failed!.runId, seededRunIds.failed!.clientIds)).toEqual(
        [],
      );
    },
  );

  journey(
    "[INT-12][AC-02] T-02 a seed that fails half-way leaves nothing behind",
    { tag: "@phase-0" },
    async () => {
      const db = serviceClient();
      const before = await db.from("organisations").select("id", { count: "exact", head: true });
      const runId = `halfway${Date.now().toString(36)}`;
      // Pre-create the carer's email so the seed fails after the organisation and admin exist.
      const blocker = await db.auth.admin.createUser({
        email: `int-12-${runId}-carer@example.test`,
        password: "correct horse battery staple 1!",
        email_confirm: true,
      });
      await expect(seedWorld(runId)).rejects.toBeTruthy();
      if (blocker.data.user) await db.auth.admin.deleteUser(blocker.data.user.id);
      expect(await leftovers(runId)).toEqual([]);
      const after = await db.from("organisations").select("id", { count: "exact", head: true });
      expect(after.count).toBe(before.count);
    },
  );
});

journey.describe("[INT-12][AC-02] three signed-in contexts and the mail reader", () => {
  journey(
    "[INT-12][AC-02] T-02 family, carer and admin (with a TOTP code) are signed in at once, each in their own context",
    { tag: "@phase-0" },
    async ({ browser, baseURL, world }) => {
      const sessions = await openRoles(browser, world, baseURL);
      try {
        await expect(sessions.admin.page).toHaveURL(/\/admin\/home$/);
        await expect(sessions.carer.page).toHaveURL(/\/carer\/home$/);
        await expect(sessions.family.page).toHaveURL(
          new RegExp(`/family/${world.client.id}/home$`),
        );
        // Separate contexts: signing one role out leaves the others signed in.
        await sessions.carer.page.getByRole("button", { name: "Sign out" }).click();
        await expect(sessions.carer.page).toHaveURL(/\/sign-in$/);
        await sessions.admin.page.goto("/admin/staff");
        await expect(sessions.admin.page).toHaveURL(/\/admin\/staff$/);
      } finally {
        await closeRoles(sessions);
      }
    },
  );

  journey(
    "[INT-12][AC-02] T-02 the mail-catcher reader returns the link of a real reset email",
    { tag: "@phase-0" },
    async ({ world }) => {
      const since = Date.now();
      const anon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: { persistSession: false },
        },
      );
      await anon.auth.resetPasswordForEmail(world.family.email);
      const { link, subject } = await waitForEmailLink(world.family.email, { since });
      expect(new URL(link).pathname).toBe("/auth/confirm");
      expect(subject).toMatch(/password/i);
    },
  );
});
