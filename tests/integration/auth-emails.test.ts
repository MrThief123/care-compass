// @vitest-environment node
import { createClient } from "@supabase/supabase-js";
import { afterAll, describe, expect, it } from "vitest";

import { createAdminClient } from "@/server/jobs/supabase-admin";

import { countEmailsTo, waitForEmailLink } from "../helpers/mailpit";

// Requires a running local Supabase stack (`supabase start`, migrations applied, templates from
// supabase/templates registered in config.toml). Skips against a hosted project, like the other
// integration tests. Real emails are read from the local Mailpit; no mocks.
const isLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
);
const hasLocalSupabase =
  isLocalUrl &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const PASSWORD = "correct horse battery staple 1!";
const created: string[] = [];

function email(label: string) {
  return `f0-24-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function registered(label: string) {
  const address = email(label);
  const { data, error } = await createAdminClient().auth.admin.createUser({
    email: address,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  created.push(data.user.id);
  return address;
}

/** The link's own token_hash and type: what /auth/confirm receives. */
function parts(link: string) {
  const url = new URL(link);
  return {
    path: url.pathname,
    tokenHash: url.searchParams.get("token_hash"),
    type: url.searchParams.get("type"),
    next: url.searchParams.get("next"),
  };
}

afterAll(async () => {
  for (const id of created) await createAdminClient().auth.admin.deleteUser(id);
});

describe.skipIf(!hasLocalSupabase)("[F0-24] real emails on the local stack", () => {
  it("[F0-24][AC-01] the recovery email links to /auth/confirm with a token_hash that verifies once", async () => {
    const address = await registered("reset");
    const since = Date.now();
    await anonClient().auth.resetPasswordForEmail(address);
    const { link } = await waitForEmailLink(address, { since });
    const { path, tokenHash, type, next } = parts(link);
    expect(path).toBe("/auth/confirm");
    expect(type).toBe("recovery");
    expect(next).toBe("/reset-password");
    expect(tokenHash).toBeTruthy();

    const client = anonClient();
    const first = await client.auth.verifyOtp({ type: "recovery", token_hash: tokenHash! });
    expect(first.error).toBeNull();
    expect(first.data.session).not.toBeNull();
  });

  it("[F0-24][AC-02] a used, tampered or empty token_hash fails and creates no session", async () => {
    const address = await registered("used");
    const since = Date.now();
    await anonClient().auth.resetPasswordForEmail(address);
    const { tokenHash } = parts((await waitForEmailLink(address, { since })).link);
    await anonClient().auth.verifyOtp({ type: "recovery", token_hash: tokenHash! });

    for (const hash of [tokenHash!, `${tokenHash}x`, "", "0".repeat(tokenHash!.length)]) {
      const { data, error } = await anonClient().auth.verifyOtp({
        type: "recovery",
        token_hash: hash,
      });
      expect(error).not.toBeNull();
      expect(data.session).toBeNull();
    }
  });

  it("[F0-24][AC-03] an invite email links to /auth/confirm type=invite and verifies into a session", async () => {
    const address = email("invite");
    const since = Date.now();
    const { data, error } = await createAdminClient().auth.admin.inviteUserByEmail(address);
    if (error || !data.user) throw error ?? new Error("invite failed");
    created.push(data.user.id);
    const { link } = await waitForEmailLink(address, { since });
    const { path, tokenHash, type, next } = parts(link);
    expect(path).toBe("/auth/confirm");
    expect(type).toBe("invite");
    expect(next).toBe("/set-password");

    const result = await anonClient().auth.verifyOtp({ type: "invite", token_hash: tokenHash! });
    expect(result.error).toBeNull();
    expect(result.data.session).not.toBeNull();
  });

  it("[F0-24][AC-04] inviting an email that already has an account creates no user and sends no email", async () => {
    const address = await registered("existing");
    const before = await countEmailsTo(address);
    const { error } = await createAdminClient().auth.admin.inviteUserByEmail(address);
    expect(error).not.toBeNull();
    const { data } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 });
    expect(data.users.filter((u) => u.email === address)).toHaveLength(1);
    expect(await countEmailsTo(address)).toBe(before);
  });

  it("[F0-24][AC-05] resending to a pending carer sends one new invite email", async () => {
    const address = email("resend");
    const first = await createAdminClient().auth.admin.inviteUserByEmail(address);
    if (first.error || !first.data.user) throw first.error ?? new Error("invite failed");
    created.push(first.data.user.id);
    await waitForEmailLink(address);
    const before = await countEmailsTo(address);

    const { resendStaffInviteEmail } = await import("@/server/jobs/admin-invite-staff");
    await resendStaffInviteEmail(address);

    await waitForEmailLink(address, { since: Date.now() - 3_000 });
    expect(await countEmailsTo(address)).toBe(before + 1);
  });

  it("[F0-24][AC-05] resending to someone who already accepted is refused and sends nothing", async () => {
    const address = await registered("accepted");
    const before = await countEmailsTo(address);
    const { resendStaffInviteEmail } = await import("@/server/jobs/admin-invite-staff");
    await expect(resendStaffInviteEmail(address)).rejects.toThrow();
    expect(await countEmailsTo(address)).toBe(before);
  });

  it("[F0-24][AC-06] a reset request for an unregistered email returns the same response as a registered one", async () => {
    const known = await registered("enum");
    const a = await anonClient().auth.resetPasswordForEmail(known);
    const b = await anonClient().auth.resetPasswordForEmail(email("nobody"));
    expect(b.error?.message ?? null).toBe(a.error?.message ?? null);
    expect(b.data).toEqual(a.data);
  });
});
