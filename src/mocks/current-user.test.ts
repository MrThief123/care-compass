import { afterEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser } from "./current-user";

describe("[UI-00][AC-05] mock current-user throws in production", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when NODE_ENV=production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(getCurrentUser()).rejects.toThrow();
  });

  it("does not throw outside production (development-only mock)", async () => {
    vi.stubEnv("NODE_ENV", "test");
    await expect(getCurrentUser()).resolves.toBeDefined();
  });
});
