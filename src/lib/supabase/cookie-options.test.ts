// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * F0-21 AC-02 (T-02). `@supabase/ssr` 0.12.7's defaults are `httpOnly: false`, `sameSite: "lax"`
 * and no `secure`. Every Supabase client in this app runs on the server (the browser client in
 * `browser.ts` has no caller), so the session cookies can be HttpOnly: no script in the page ever
 * needs to read them, and an XSS bug can then not lift the session token.
 */

const createServerClient = vi.fn(() => ({
  auth: { getUser: vi.fn(async () => ({ data: { user: null }, error: null })) },
}));
vi.mock("@supabase/ssr", () => ({ createServerClient }));

let requestHeaders = new Headers({ host: "carecompass.example.org" });
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: vi.fn() }),
  headers: async () => requestHeaders,
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  createServerClient.mockClear();
});
afterEach(() => vi.unstubAllEnvs());

type CallOptions = { cookieOptions?: Record<string, unknown> };
const lastOptions = () =>
  (createServerClient.mock.calls.at(-1) as unknown as [string, string, CallOptions])[2];

describe("[F0-21][AC-02] session cookie flags", () => {
  it("[F0-21][AC-02] T-02 HttpOnly, SameSite=Lax and path / on every host", async () => {
    const { sessionCookieOptions } = await import("./cookie-options");
    for (const host of ["carecompass.example.org", "127.0.0.1:3000", "localhost:3000", null]) {
      expect(sessionCookieOptions(host)).toMatchObject({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }
  });

  it("[F0-21][AC-02] T-02 Secure in production on a real host", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { sessionCookieOptions } = await import("./cookie-options");
    expect(sessionCookieOptions("carecompass.example.org").secure).toBe(true);
    expect(sessionCookieOptions("carecompass.example.org:443").secure).toBe(true);
    // An unknown host is treated as a real one: Secure is the default, never the exception.
    expect(sessionCookieOptions(null).secure).toBe(true);
  });

  it("[F0-21][AC-02] T-02 not Secure on loopback, so a local http production build still signs in", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { sessionCookieOptions } = await import("./cookie-options");
    for (const host of ["127.0.0.1:3100", "localhost:3000", "localhost", "[::1]:3000"]) {
      expect(sessionCookieOptions(host).secure).toBe(false);
    }
  });

  it("[F0-21][AC-02] T-02 not Secure in development (plain http)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { sessionCookieOptions } = await import("./cookie-options");
    expect(sessionCookieOptions("carecompass.example.org").secure).toBe(false);
  });

  it("[F0-21][AC-02] T-02 the server client (Server Components, Actions, Route Handlers) sets them", async () => {
    vi.stubEnv("NODE_ENV", "production");
    requestHeaders = new Headers({ host: "carecompass.example.org" });
    const { createClient } = await import("./server");
    await createClient();
    expect(lastOptions().cookieOptions).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });
  });

  it("[F0-21][AC-02] T-02 the proxy's session refresh sets them", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { updateSession } = await import("./middleware");
    await updateSession(new NextRequest("https://carecompass.example.org/admin/home"));
    expect(lastOptions().cookieOptions).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });
  });
});
