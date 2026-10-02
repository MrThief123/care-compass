import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyOtp = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { verifyOtp } }),
}));

import { GET } from "./route";

const ORIGIN = "http://localhost:3000";

function confirm(next?: string) {
  const url = new URL(`${ORIGIN}/auth/confirm`);
  url.searchParams.set("token_hash", "hash");
  url.searchParams.set("type", "recovery");
  if (next !== undefined) url.searchParams.set("next", next);
  return GET(new NextRequest(url));
}

beforeEach(() => {
  verifyOtp.mockReset();
  verifyOtp.mockResolvedValue({ error: null });
});

describe("[F0-21][FD-09] /auth/confirm only redirects within the app", () => {
  it("[F0-21][FD-09] follows a same-origin path", async () => {
    const response = await confirm("/reset-password");
    expect(response.headers.get("location")).toBe(`${ORIGIN}/reset-password`);
  });

  it("[F0-21][FD-09] keeps the query string of a same-origin path", async () => {
    const response = await confirm("/reset-password?from=email");
    expect(response.headers.get("location")).toBe(`${ORIGIN}/reset-password?from=email`);
  });

  it("[F0-21][FD-09] defaults to /reset-password without next", async () => {
    const response = await confirm();
    expect(response.headers.get("location")).toBe(`${ORIGIN}/reset-password`);
  });

  it.each([
    "https://evil.example",
    "//evil.example/x",
    "/\\evil.example",
    "\\\\evil.example",
    "/\t/evil.example",
    "javascript:alert(1)",
    "http://localhost:3001/reset-password",
  ])("[F0-21][FD-09] ignores off-site next %j and uses /reset-password", async (next) => {
    const response = await confirm(next);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/reset-password`);
  });

  it("[F0-21][FD-09] an invalid link still goes back to sign-in", async () => {
    verifyOtp.mockResolvedValue({ error: new Error("expired") });
    const response = await confirm("https://evil.example");
    expect(response.headers.get("location")).toBe(`${ORIGIN}/sign-in?reason=reset-link-expired`);
  });
});
