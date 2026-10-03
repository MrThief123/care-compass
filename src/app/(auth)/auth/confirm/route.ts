import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Turns an emailed link into a session, then redirects to `?next`. Two link forms (F0-24 FD-01):
 * `token_hash` + `type` (what our email templates send; needs no code verifier, so it works for
 * the admin API's invite and on another device) and `code` (a link generated the default PKCE
 * way). Only the two types the app emails are accepted. An expired, used, tampered or missing
 * token sends the user back to sign-in with the option to request a new one (PRD.md F0-07
 * Error/Edge Cases); every failure looks the same and creates no session.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");

  const base = browserOrigin(request);
  const emailType = type === "recovery" || type === "invite" ? type : null;
  const next =
    sameOriginUrl(searchParams.get("next"), base) ??
    new URL(emailType === "invite" ? SET_PASSWORD_PATH : DEFAULT_NEXT, base);

  if (tokenHash && emailType) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type: emailType, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(next);
  } else if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(next);
  }

  return NextResponse.redirect(new URL("/sign-in?reason=reset-link-expired", base));
}

/**
 * The origin the browser used, not `request.url`: Next reports `localhost` there even when the
 * link was opened on `127.0.0.1`, and the session cookie set here is host-only, so redirecting to
 * a different host would arrive signed out. Same headers `getOrigin` in `src/server/auth/actions.ts`
 * trusts; they only ever point a person back at the host they already used.
 */
function browserOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return request.url;
  const proto =
    request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  return `${proto}://${host}`;
}

const DEFAULT_NEXT = "/reset-password";
const SET_PASSWORD_PATH = "/set-password";

/**
 * F0-21 FD-09: `?next` is untrusted. Resolving it against the request and comparing origins
 * rejects every off-site form (`https://…`, `//host`, `/\host`, `javascript:`) without
 * hand-matching them; anything that isn't this app falls back to the default.
 */
function sameOriginUrl(next: string | null, base: string): URL | null {
  if (!next) return null;
  try {
    const url = new URL(next, base);
    return url.origin === new URL(base).origin ? url : null;
  } catch {
    return null;
  }
}
