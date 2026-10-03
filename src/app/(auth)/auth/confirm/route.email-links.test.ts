import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyOtp = vi.fn();
const exchangeCodeForSession = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { verifyOtp, exchangeCodeForSession } }),
}));

import { GET } from "./route";

const ORIGIN = "http://localhost:3000";
const EXPIRED = `${ORIGIN}/sign-in?reason=reset-link-expired`;

function open(params: Record<string, string>) {
  const url = new URL(`${ORIGIN}/auth/confirm`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return GET(new NextRequest(url));
}

beforeEach(() => {
  verifyOtp.mockReset().mockResolvedValue({ error: null });
  exchangeCodeForSession.mockReset().mockResolvedValue({ error: null });
});

describe("[F0-24][AC-01] /auth/confirm accepts both link forms", () => {
  it("[F0-24][AC-01] token_hash + type=recovery verifies the OTP and goes to /reset-password", async () => {
    const response = await open({ token_hash: "hash", type: "recovery" });
    expect(verifyOtp).toHaveBeenCalledWith({ type: "recovery", token_hash: "hash" });
    expect(response.headers.get("location")).toBe(`${ORIGIN}/reset-password`);
  });

  it("[F0-24][AC-01] ?code= exchanges the code for a session and follows next", async () => {
    const response = await open({ code: "pkce-code", next: "/reset-password" });
    expect(exchangeCodeForSession).toHaveBeenCalledWith("pkce-code");
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(`${ORIGIN}/reset-password`);
  });
});

describe("[F0-24][AC-03] invite links land on /set-password", () => {
  it("[F0-24][AC-03] token_hash + type=invite defaults to /set-password", async () => {
    const response = await open({ token_hash: "hash", type: "invite" });
    expect(verifyOtp).toHaveBeenCalledWith({ type: "invite", token_hash: "hash" });
    expect(response.headers.get("location")).toBe(`${ORIGIN}/set-password`);
  });

  it("[F0-24][AC-03] an explicit same-origin next still wins", async () => {
    const response = await open({ token_hash: "hash", type: "invite", next: "/set-password" });
    expect(response.headers.get("location")).toBe(`${ORIGIN}/set-password`);
  });
});

describe("[F0-24][AC-02] bad links fail the same way and create no session", () => {
  it("[F0-24][AC-02] an expired or already-used token_hash goes to the expired-link path", async () => {
    verifyOtp.mockResolvedValue({ error: new Error("Token has expired or is invalid") });
    expect((await open({ token_hash: "used", type: "recovery" })).headers.get("location")).toBe(
      EXPIRED,
    );
  });

  it("[F0-24][AC-02] a failed code exchange goes to the expired-link path", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error("invalid grant") });
    expect((await open({ code: "bad" })).headers.get("location")).toBe(EXPIRED);
  });

  it.each([
    ["no token at all", {}],
    ["token_hash without a type", { token_hash: "hash" }],
    ["a type without a token_hash", { type: "invite" }],
    ["an empty code", { code: "" }],
  ])("[F0-24][AC-02] %s goes to the expired-link path without calling Supabase", async (_, p) => {
    expect((await open(p)).headers.get("location")).toBe(EXPIRED);
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("[F0-24][AC-02] an unknown type is refused without calling Supabase", async () => {
    expect((await open({ token_hash: "hash", type: "bogus" })).headers.get("location")).toBe(
      EXPIRED,
    );
    expect(verifyOtp).not.toHaveBeenCalled();
  });
});

describe("[F0-24][AC-06] off-site next is ignored on both link forms", () => {
  it.each([
    ["token_hash", { token_hash: "hash", type: "recovery" }],
    ["code", { code: "pkce-code" }],
  ])("[F0-24][AC-06] %s with next=https://evil.example stays on /reset-password", async (_, p) => {
    const response = await open({ ...p, next: "https://evil.example" });
    expect(response.headers.get("location")).toBe(`${ORIGIN}/reset-password`);
  });
});
