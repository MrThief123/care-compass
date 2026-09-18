import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REQUIRED_VARS = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
} as const;

describe("env", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("[F0-04][AC-01] throws naming NEXT_PUBLIC_SUPABASE_URL when it is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", REQUIRED_VARS.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    await expect(import("./env")).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("[F0-04][AC-01] throws naming NEXT_PUBLIC_SUPABASE_ANON_KEY when it is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", REQUIRED_VARS.NEXT_PUBLIC_SUPABASE_URL);

    await expect(import("./env")).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("loads successfully with only the required public variables set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", REQUIRED_VARS.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", REQUIRED_VARS.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const { env } = await import("./env");

    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(REQUIRED_VARS.NEXT_PUBLIC_SUPABASE_URL);
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
  });

  it("accepts the optional service-role key when present", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", REQUIRED_VARS.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", REQUIRED_VARS.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    const { env } = await import("./env");

    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("service-role-key");
  });
});
