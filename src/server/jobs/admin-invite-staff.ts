import "server-only";

import { createAdminClient } from "@/server/jobs/supabase-admin";

/**
 * ADM-02: creates the auth account for a newly invited carer (PD-040, PD-057 — carers stay
 * invite-only; the account is created by an admin, never self-registered). This is here, not in
 * `src/server/admin/**`, because it is the one place a service-role client may be imported
 * (`eslint.config.mjs`, ADR-02): a signed-in admin's own session can never create another user's
 * `auth.users` row, since `supabase.auth.signUp()` would sign the caller in as the new user instead.
 *
 * Out-of-lane note (ADM-02 DECISIONS.md FD-01): `src/server/jobs/**` is Lane B's folder; this file
 * was added by the Lane A (Admin) feature that needed it, flagged here and in the PR rather than
 * silently added, per CLAUDE.md §4.2. The ADM-02 PRD's own Technical Considerations names this exact
 * exception ("Account creation requires service role in an isolated server module").
 *
 * Callers must already have verified the caller is a signed-in, active admin before calling this —
 * it does no authorisation itself, since the service-role client bypasses RLS entirely. The caller
 * then inserts the profile through `admin_create_staff_profile` (RLS-backed, session-scoped,
 * `supabase/migrations/20260929000000_admin_staff.sql`), and calls `admin_discard_staff_invite` (the
 * same RPC, not this module — it deletes an `auth.users` row directly, the same way
 * `discard_unregistered_account()` already does for F0-17) to clean up if that insert fails.
 */
export async function inviteStaffAccount(email: string): Promise<{ userId: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error || !data.user) {
    // Supabase reports an existing account by throwing here; the message is passed through
    // (no client detail beyond the email the caller already gave us, ARCHITECTURE.md §12.5).
    throw new Error(error?.message || "could not invite this email address");
  }
  return { userId: data.user.id };
}
