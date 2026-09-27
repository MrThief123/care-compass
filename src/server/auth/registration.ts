import "server-only";

import type { Database } from "@/lib/supabase/database.types";

import type { SignUpInput } from "./sign-up-schema";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Typed wrapper over the F0-17 registration RPCs. `database.types.ts` does not know them
 * yet and is not regenerated here (FD-06), so the calls are cast in one place. Remove the
 * casts when the types are regenerated.
 */
type Supabase = SupabaseClient<Database>;

type UntypedRpc = (
  fn: string,
  args?: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }>;

function rpc(supabase: Supabase): UntypedRpc {
  return supabase.rpc.bind(supabase) as unknown as UntypedRpc;
}

/** `register_account()` — creates the caller's profile and its client or organisation. */
export async function registerAccount(supabase: Supabase, input: SignUpInput) {
  return rpc(supabase)("register_account", {
    p_role: input.accountType === "family" ? "family" : "admin",
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    ...(input.accountType === "family"
      ? { p_client_first_name: input.clientFirstName, p_client_last_name: input.clientLastName }
      : { p_organisation_name: input.organisationName }),
  });
}

/** `discard_unregistered_account()` — removes the caller's own auth user, only while it has no profile (FD-01). */
export async function discardUnregisteredAccount(supabase: Supabase) {
  return rpc(supabase)("discard_unregistered_account");
}
