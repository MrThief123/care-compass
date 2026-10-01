/**
 * `auth` domain query contract. Wraps `src/mocks/current-user.ts` (the
 * mock session UI-00 established, PRD.md F0-15 "Inputs: Session profile")
 * so `src/app`/`src/features` never import `src/mocks` directly
 * (lint-enforced). Under `DATA_SOURCE=supabase` this resolves the real
 * session and enforces the route-group guard (F0-07): unauthenticated,
 * wrong-role, deactivated-profile and (admin) unmet-MFA all redirect here
 * rather than returning, so every call site that already awaits
 * `getCurrentUser(role)` gets the guard for free.
 */
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getDataSourceMode } from "@/server/data-source";
import type { Role } from "@/types/domain";

import { evaluateLanding, evaluateRoleGuard } from "./guard";

export type { CurrentUser } from "@/mocks/current-user";

export async function getCurrentUser(role: Role) {
  // F0-21: never prerender a guarded page. Without this, a build run with no DATA_SOURCE (the
  // build phase falls back to mock) froze pages whose mock branch used no request API into static
  // HTML, served to anyone with no guard at all. Waiting for a request makes every page that
  // calls the guard render per request, where the runtime DATA_SOURCE decides.
  await atRequestTime();
  const mode = getDataSourceMode();
  if (mode === "mock") {
    const mock = await import("@/mocks/current-user");
    return mock.getCurrentUser(role);
  }

  const supabase = await createClient();
  const outcome = await evaluateRoleGuard(supabase, role);

  if (outcome.action === "redirect") {
    redirect(outcome.to);
  }

  return outcome.user;
}

/**
 * `connection()`, except when called outside Next altogether (a unit test rendering a layout
 * directly), where Next reports a missing request scope and there is nothing to prerender. Every
 * other error — including the ones Next uses to interrupt a prerender — is rethrown.
 */
async function atRequestTime(): Promise<void> {
  try {
    await connection();
  } catch (error) {
    if (error instanceof Error && error.message.includes("was called outside a request scope")) {
      return;
    }
    throw error;
  }
}

/** Used by `/mfa/enroll` and `/mfa/verify` — the signed-in user's TOTP factor, if any. */
export async function getPrimaryTotpFactorId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  return data?.totp[0]?.id ?? null;
}

/**
 * Where `/` sends the visitor (F0-19). Sign-in is always real Supabase auth,
 * even under `DATA_SOURCE=mock`, so this does not branch on the data source.
 */
export async function getLandingPath(): Promise<string> {
  return evaluateLanding(await createClient());
}
