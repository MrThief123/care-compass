import { afterEach, describe, expect, it, vi } from "vitest";

import { getDataSourceMode } from "./data-source";

afterEach(() => vi.unstubAllEnvs());

describe("[F0-19][AC-07] production must choose its data source", () => {
  it("[F0-19][AC-07] T-06 throws when DATA_SOURCE is unset in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATA_SOURCE", "");
    expect(() => getDataSourceMode()).toThrow(/DATA_SOURCE/);
  });

  it("[F0-19][AC-07] T-06 accepts an explicit DATA_SOURCE in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATA_SOURCE", "supabase");
    expect(getDataSourceMode()).toBe("supabase");
    vi.stubEnv("DATA_SOURCE", "mock");
    expect(getDataSourceMode()).toBe("mock");
  });

  it("[F0-19][AC-07] T-06 does not throw while `next build` prerenders", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    vi.stubEnv("DATA_SOURCE", "");
    expect(getDataSourceMode()).toBe("mock");
  });

  it.each(["development", "test"])("[F0-19][AC-07] T-06 defaults to mock in %s", (env) => {
    vi.stubEnv("NODE_ENV", env);
    vi.stubEnv("DATA_SOURCE", "");
    expect(getDataSourceMode()).toBe("mock");
  });
});
