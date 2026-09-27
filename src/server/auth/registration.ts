import "server-only";

import type { Database } from "@/lib/supabase/database.types";

import type { SignUpInput } from "./sign-up-schema";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Typed calls to the F0-17 registration RPCs, now that `database.types.ts` knows them (F0-18 regenerated it). */
type Supabase = SupabaseClient<Database>;

/** `register_account()` — creates the caller's profile and its client or organisation. */
export async function registerAccount(supabase: Supabase, input: SignUpInput) {
  return supabase.rpc("register_account", {
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
  return supabase.rpc("discard_unregistered_account");
}
