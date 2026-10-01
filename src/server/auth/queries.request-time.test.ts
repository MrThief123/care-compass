// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * F0-21 AC-03 (T-04). `next build` runs with no `DATA_SOURCE` (the project dockerfile sets only the
 * two NEXT_PUBLIC_ variables), and the build phase falls back to mock (F0-19 FD-06). In mock mode
 * `getCurrentUser` never touched a request API, so /admin/home, /admin/clients, /admin/staff,
 * /admin/settings and /carer/settings were prerendered once, at build time, as static mock pages:
 * served to anyone, signed in or not, with the role guard never running. The guard must always run
 * per request, so it opts out of prerendering before it does anything else.
 */
const calls: string[] = [];
vi.mock("next/server", () => ({
  connection: vi.fn(async () => {
    calls.push("connection");
  }),
}));
vi.mock("@/mocks/current-user", () => ({
  getCurrentUser: vi.fn(async () => {
    calls.push("mock-user");
    return { profileId: "p", role: "admin", organisationId: "o", firstName: "A", lastName: "B" };
  }),
}));

afterEach(() => {
  calls.length = 0;
  vi.unstubAllEnvs();
});

describe("[F0-21][AC-03] the role guard always runs at request time", () => {
  it("[F0-21][AC-03] T-04 getCurrentUser waits for a request before resolving, even in mock mode", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    const { getCurrentUser } = await import("./queries");
    await getCurrentUser("admin");
    expect(calls).toEqual(["connection", "mock-user"]);
  });
});
