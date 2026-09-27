// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/server/jobs/supabase-admin";

// Requires a running local Supabase stack (`supabase start`) and `.env.local`
// populated from `supabase status` — same convention as F0-07's shared-authentication
// integration test. Skips cleanly wherever that isn't set up.
const hasLocalSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const PASSWORD = "correct horse battery staple 1!";

function unique(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function uniqueEmail(label: string): string {
  return `f0-17-${unique(label)}@example.test`;
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

/** Runs `run` with `next/headers` mocked onto `cookieStore` (same technique as F0-07's test). */
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
    headers: async () => new Headers({ host: "127.0.0.1:3000", "x-forwarded-proto": "http" }),
  }));
  try {
    return await run();
  } finally {
    vi.doUnmock("next/headers");
  }
}

interface FamilySignUp {
  accountType: "family";
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  clientFirstName: string;
  clientLastName: string;
}

interface OrganisationSignUp {
  accountType: "organisation";
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  organisationName: string;
}

function familyInput(overrides: Partial<FamilySignUp> = {}): FamilySignUp {
  return {
    accountType: "family",
    firstName: "Grace",
    lastName: "Smith",
    email: uniqueEmail("family"),
    password: PASSWORD,
    confirmPassword: PASSWORD,
    clientFirstName: "Harold",
    clientLastName: unique("Smith"),
    ...overrides,
  };
}

function organisationInput(overrides: Partial<OrganisationSignUp> = {}): OrganisationSignUp {
  return {
    accountType: "organisation",
    firstName: "Owen",
    lastName: "Park",
    email: uniqueEmail("org"),
    password: PASSWORD,
    confirmPassword: PASSWORD,
    organisationName: unique("Wattle Care"),
    ...overrides,
  };
}

async function callSignUp(input: unknown, cookieStore = new Map<string, string>()) {
  const outcome = await withCookieClient(cookieStore, async () => {
    const { signUp } = await import("@/server/auth/actions");
    return signUp(input as never);
  });
  return { outcome, cookieStore };
}

async function findAuthUser(email: string) {
  const { data, error } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.find((user) => user.email === email);
}

async function countRows(table: "organisations" | "clients", column: string, value: string) {
  const { count, error } = await createAdminClient()
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);
  if (error) throw error;
  return count ?? 0;
}

/** Removes everything a test created, whatever state it reached. */
async function cleanUp(opts: {
  emails?: string[];
  clientLastNames?: string[];
  orgNames?: string[];
}) {
  const admin = createAdminClient();
  for (const email of opts.emails ?? []) {
    const user = await findAuthUser(email);
    if (user) await admin.auth.admin.deleteUser(user.id);
  }
  for (const lastName of opts.clientLastNames ?? []) {
    await admin.from("clients").delete().eq("last_name", lastName);
  }
  for (const name of opts.orgNames ?? []) {
    await admin.from("organisations").delete().eq("name", name);
  }
}

describe.skipIf(!hasLocalSupabase)("[F0-17] sign-up", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
  });

  it("[F0-17][AC-02] organisation sign-up creates the organisation and an admin profile, and routes like an existing admin", async () => {
    const admin = createAdminClient();
    const input = organisationInput();

    // An existing admin of another organisation, for the routing comparison.
    const existingOrg = unique("Existing Org");
    const { data: org } = await admin
      .from("organisations")
      .insert({ name: existingOrg })
      .select("id")
      .single();
    const existingEmail = uniqueEmail("existing-admin");
    const { data: created } = await admin.auth.admin.createUser({
      email: existingEmail,
      password: PASSWORD,
      email_confirm: true,
    });
    await admin.from("profiles").insert({
      id: created!.user!.id,
      role: "admin",
      organisation_id: org!.id,
      first_name: "Existing",
      last_name: "Admin",
    });

    try {
      const { outcome } = await callSignUp(input);
      expect(outcome.ok).toBe(true);

      const user = await findAuthUser(input.email);
      expect(user).toBeDefined();

      const { data: profile } = await admin
        .from("profiles")
        .select("role, organisation_id, first_name, last_name, is_active")
        .eq("id", user!.id)
        .single();
      expect(profile).toMatchObject({
        role: "admin",
        first_name: "Owen",
        last_name: "Park",
        is_active: true,
      });

      const { data: organisation } = await admin
        .from("organisations")
        .select("id, name")
        .eq("id", profile!.organisation_id!)
        .single();
      expect(organisation!.name).toBe(input.organisationName);
      expect(await countRows("organisations", "name", input.organisationName)).toBe(1);

      const existing = await callSignIn(existingEmail);
      expect(existing.ok).toBe(true);
      if (outcome.ok && existing.ok) {
        expect(outcome.data.redirectTo).toBe(existing.data.redirectTo);
      }
    } finally {
      await cleanUp({
        emails: [input.email, existingEmail],
        orgNames: [input.organisationName, existingOrg],
      });
    }
  });

  it("[F0-17][AC-03] a missing field, mismatched passwords and a short password each return a field error and create nothing", async () => {
    const cases: Array<{ label: string; input: FamilySignUp | OrganisationSignUp; field: string }> =
      [
        { label: "missing first name", input: familyInput({ firstName: "" }), field: "firstName" },
        {
          label: "missing client name",
          input: familyInput({ clientFirstName: "" }),
          field: "clientFirstName",
        },
        {
          label: "missing organisation name",
          input: organisationInput({ organisationName: "  " }),
          field: "organisationName",
        },
        {
          label: "mismatched passwords",
          input: familyInput({ confirmPassword: `${PASSWORD}x` }),
          field: "confirmPassword",
        },
        {
          label: "short password",
          input: familyInput({ password: "abc", confirmPassword: "abc" }),
          field: "password",
        },
      ];

    for (const { label, input, field } of cases) {
      const { outcome, cookieStore } = await callSignUp(input);

      expect(outcome.ok, label).toBe(false);
      if (!outcome.ok) {
        expect(outcome.error.code, label).toBe("VALIDATION");
        expect(outcome.error.fieldErrors?.[field], label).toEqual(expect.any(String));
      }
      expect(cookieStore.size, label).toBe(0);
      expect(await findAuthUser(input.email), label).toBeUndefined();
      if (input.accountType === "family") {
        expect(await countRows("clients", "last_name", input.clientLastName), label).toBe(0);
      } else {
        expect(await countRows("organisations", "name", input.organisationName), label).toBe(0);
      }
    }
  });

  it("[F0-17][AC-04] an email that is already registered returns the 'already exists' error and creates nothing", async () => {
    const admin = createAdminClient();
    const existingEmail = uniqueEmail("helen");
    const { data: created } = await admin.auth.admin.createUser({
      email: existingEmail,
      password: PASSWORD,
      email_confirm: true,
    });
    await admin.from("profiles").insert({
      id: created!.user!.id,
      role: "family",
      first_name: "Helen",
      last_name: "Doyle",
    });
    const familyAttempt = familyInput({ email: existingEmail });
    const orgAttempt = organisationInput({ email: existingEmail });

    try {
      const { count: profilesBefore } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("last_name", "Doyle");

      for (const attempt of [familyAttempt, orgAttempt]) {
        const { outcome, cookieStore } = await callSignUp(attempt);
        expect(outcome.ok).toBe(false);
        if (!outcome.ok) {
          expect(outcome.error.code).toBe("EMAIL_EXISTS");
          expect(outcome.error.message).toContain("An account with this email already exists");
        }
        expect(cookieStore.size).toBe(0);
      }

      expect(await countRows("clients", "last_name", familyAttempt.clientLastName)).toBe(0);
      expect(await countRows("organisations", "name", orgAttempt.organisationName)).toBe(0);
      const { count: profilesAfter } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("last_name", "Doyle");
      expect(profilesAfter).toBe(profilesBefore);
    } finally {
      await cleanUp({
        emails: [existingEmail],
        clientLastNames: [familyAttempt.clientLastName],
        orgNames: [orgAttempt.organisationName],
      });
    }
  });

  it("[F0-17][AC-06] a crafted request carrying an existing organisation and client id links to neither and reads none of their rows", async () => {
    const admin = createAdminClient();
    const banksiaName = unique("Banksia Home Care");
    const margaretLastName = unique("Wells");
    const { data: banksia } = await admin
      .from("organisations")
      .insert({ name: banksiaName })
      .select("id")
      .single();
    const { data: margaret } = await admin
      .from("clients")
      .insert({ organisation_id: banksia!.id, first_name: "Margaret", last_name: margaretLastName })
      .select("id")
      .single();

    const crafted = {
      ...familyInput(),
      organisationId: banksia!.id,
      organisation_id: banksia!.id,
      clientId: margaret!.id,
      client_id: margaret!.id,
      role: "admin",
    };

    try {
      const { outcome, cookieStore } = await callSignUp(crafted);
      expect(outcome.ok).toBe(true);

      const user = await findAuthUser(crafted.email);
      const { data: profile } = await admin
        .from("profiles")
        .select("role, organisation_id")
        .eq("id", user!.id)
        .single();
      expect(profile).toEqual({ role: "family", organisation_id: null });

      const { data: links } = await admin
        .from("client_family_members")
        .select("client_id")
        .eq("profile_id", user!.id);
      expect(links).toHaveLength(1);
      expect(links![0]!.client_id).not.toBe(margaret!.id);

      // What the new session can read.
      const session = cookieClient(cookieStore);
      const { data: organisations } = await session.from("organisations").select("id");
      const { data: clients } = await session.from("clients").select("id, last_name");
      const { data: profiles } = await session.from("profiles").select("id");
      expect(organisations).toEqual([]);
      expect(clients).toHaveLength(1);
      expect(clients![0]!.last_name).toBe(crafted.clientLastName);
      expect(profiles).toEqual([{ id: user!.id }]);

      // Calling the database function directly with an organisation or client id is not possible either.
      const direct = await session.rpc(
        "register_account" as never,
        {
          p_role: "admin",
          p_first_name: "Grace",
          p_last_name: "Smith",
          p_organisation_id: banksia!.id,
        } as never,
      );
      expect(direct.error).not.toBeNull();
    } finally {
      await cleanUp({
        emails: [crafted.email],
        clientLastNames: [crafted.clientLastName, margaretLastName],
        orgNames: [banksiaName],
      });
    }
  });
});

/** Signs an existing user in through the real action, with its own cookie jar. */
async function callSignIn(email: string) {
  return withCookieClient(new Map<string, string>(), async () => {
    const { signIn } = await import("@/server/auth/actions");
    return signIn({ email, password: PASSWORD });
  });
}
