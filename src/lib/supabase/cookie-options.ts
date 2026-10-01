/**
 * Flags for the Supabase Auth session cookies (F0-21 AC-02). `@supabase/ssr` defaults to
 * `httpOnly: false` and no `secure`, because its browser client reads the session from
 * `document.cookie`. This app never does that: every Supabase client runs on the server
 * (`server.ts`, `middleware.ts`), so the cookies can be:
 *   - HttpOnly: page scripts (including an injected one) can never read the session token;
 *   - SameSite=Lax: not sent on cross-site sub-requests or form posts (CSRF), still sent when a
 *     person follows a link to the app, e.g. from an email;
 *   - Secure in production: only sent over HTTPS. A loopback host is the one exception, so a
 *     production build run locally over http (the e2e suite, `npm start`) can still sign in.
 *     Development (`next dev`, http) never sets it.
 * Do not use `browser.ts`'s client for auth while these are set: it cannot see an HttpOnly cookie.
 */
export interface SessionCookieOptions {
  httpOnly: true;
  sameSite: "lax";
  path: "/";
  secure: boolean;
}

const LOOPBACK = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i;

export function sessionCookieOptions(host: string | null | undefined): SessionCookieOptions {
  const isLoopback = typeof host === "string" && LOOPBACK.test(host.trim());
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production" && !isLoopback,
  };
}
