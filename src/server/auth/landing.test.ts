import { describe, expect, it, vi } from "vitest";

import { evaluateLanding } from "./guard";

type Profile = { id: string; role: "admin" | "carer" | "family"; is_active: boolean };

interface FakeOptions {
  user?: { id: string } | null;
  profile?: Profile | null;
  factors?: number;
  aal?: { currentLevel: string; nextLevel: string };
  clientId?: string | null;
}

function fakeSupabase(opts: FakeOptions) {
  const table = (data: unknown) => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data }),
        limit: () => ({ maybeSingle: async () => ({ data }) }),
      }),
    }),
  });
  return {
    auth: {
      getUser: async () => ({ data: { user: opts.user ?? null } }),
      signOut: vi.fn(async () => ({})),
      mfa: {
        listFactors: async () => ({ data: { totp: Array(opts.factors ?? 0).fill({ id: "f" }) } }),
        getAuthenticatorAssuranceLevel: async () => ({
          data: opts.aal ?? { currentLevel: "aal1", nextLevel: "aal1" },
        }),
      },
    },
    from: (name: string) =>
      table(
        name === "profiles"
          ? (opts.profile ?? null)
          : opts.clientId
            ? { client_id: opts.clientId }
            : null,
      ),
  } as never;
}

const user = { id: "u1" };

describe("[F0-19][AC-01] signed-out landing", () => {
  it("[F0-19][AC-01] T-01 sends a signed-out visitor to /sign-in", async () => {
    expect(await evaluateLanding(fakeSupabase({ user: null }))).toBe("/sign-in");
  });
});

describe("[F0-19][AC-02] role home landing", () => {
  it("[F0-19][AC-02] T-02 admin at AAL2 lands on /admin/home", async () => {
    const supabase = fakeSupabase({
      user,
      profile: { id: "u1", role: "admin", is_active: true },
      factors: 1,
      aal: { currentLevel: "aal2", nextLevel: "aal2" },
    });
    expect(await evaluateLanding(supabase)).toBe("/admin/home");
  });

  it("[F0-19][AC-02] T-02 carer lands on /carer/home", async () => {
    const supabase = fakeSupabase({ user, profile: { id: "u1", role: "carer", is_active: true } });
    expect(await evaluateLanding(supabase)).toBe("/carer/home");
  });

  it("[F0-19][AC-02] T-02 family lands on their first client's home", async () => {
    const supabase = fakeSupabase({
      user,
      profile: { id: "u1", role: "family", is_active: true },
      clientId: "c1",
    });
    expect(await evaluateLanding(supabase)).toBe("/family/c1/home");
  });

  it("[F0-19][AC-02] T-02 family with no client lands on /no-client-linked", async () => {
    const supabase = fakeSupabase({ user, profile: { id: "u1", role: "family", is_active: true } });
    expect(await evaluateLanding(supabase)).toBe("/no-client-linked");
  });

  it("[F0-19][AC-02] T-02 inactive profile is signed out and sent to sign-in", async () => {
    const supabase = fakeSupabase({ user, profile: { id: "u1", role: "carer", is_active: false } });
    expect(await evaluateLanding(supabase)).toBe("/sign-in?reason=inactive");
  });
});

describe("[F0-19][AC-05] admin MFA gate", () => {
  it("[F0-19][AC-05] T-02 admin below AAL2 goes to the MFA gate, not home", async () => {
    const supabase = fakeSupabase({
      user,
      profile: { id: "u1", role: "admin", is_active: true },
      factors: 1,
      aal: { currentLevel: "aal1", nextLevel: "aal2" },
    });
    expect(await evaluateLanding(supabase)).toBe("/mfa/verify");
  });

  it("[F0-19][AC-05] T-02 admin with no TOTP factor goes to enrolment", async () => {
    const supabase = fakeSupabase({
      user,
      profile: { id: "u1", role: "admin", is_active: true },
      factors: 0,
    });
    expect(await evaluateLanding(supabase)).toBe("/mfa/enroll");
  });
});
