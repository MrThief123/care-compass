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

import { createClient } from "@/lib/supabase/server";
import { getDataSourceMode } from "@/server/data-source";
import type { Role } from "@/types/domain";

import { evaluateRoleGuard } from "./guard";

export type { CurrentUser } from "@/mocks/current-user";

export async function getCurrentUser(role: Role) {
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

/** Used by `/mfa/enroll` and `/mfa/verify` — the signed-in user's TOTP factor, if any. */
export async function getPrimaryTotpFactorId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  return data?.totp[0]?.id ?? null;
}
