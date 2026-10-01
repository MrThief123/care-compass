import { freshTotpCode, totpCode } from "./totp";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Test-only (F0-21). Admin authority in RLS needs an AAL2 session (migration
 * 20261001121303_admin_aal2_rls.sql), exactly as the app's route guard does, so an integration test
 * that acts as an admin must complete TOTP like a real admin. This enrols a TOTP factor on the
 * signed-in user the first time (through Supabase Auth's real API, local stack only) and verifies a
 * code; later sign-ins of the same user reuse that factor. Family and carer sessions are never
 * stepped up (CHG-040). Reuses F0-20's RFC 6238 helper; no new dependency.
 */
const factors = new Map<string, { factorId: string; secret: string; lastCode?: string }>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any, any, any>;

export async function stepUpToAal2(client: AnyClient): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();
  if (userError || !user) throw userError ?? new Error("stepUpToAal2: not signed in");

  let factor = factors.get(user.id);
  if (!factor) {
    const { data, error } = await client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `test-totp-${crypto.randomUUID()}`,
    });
    if (error || !data) throw error ?? new Error("stepUpToAal2: enrol failed");
    factor = { factorId: data.id, secret: data.totp.secret };
    factors.set(user.id, factor);
  }

  let code = totpCode(factor.secret);
  let { error } = await client.auth.mfa.challengeAndVerify({ factorId: factor.factorId, code });
  if (error && code === factor.lastCode) {
    // Refused as a replay of this 30 s window's code: wait for the next one.
    code = await freshTotpCode(factor.secret, code);
    ({ error } = await client.auth.mfa.challengeAndVerify({ factorId: factor.factorId, code }));
  }
  if (error) throw error;
  factor.lastCode = code;
}

/** Steps the session up only when the signed-in profile is an admin. */
export async function stepUpIfAdmin(client: AnyClient): Promise<void> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return;
  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role === "admin") await stepUpToAal2(client);
}
