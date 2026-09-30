import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn(
    async () => new Response(null, { status: 200, headers: { "x-session": "1" } }),
  ),
}));

import { proxy } from "./proxy";

const DEV_PREVIEW_PATHS = [
  "/dev-preview",
  "/dev-preview-calendar-kit",
  "/dev-preview-database",
  "/dev-preview-forms-kit",
];

function request(path: string) {
  return new NextRequest(`http://localhost:3000${path}`);
}

afterEach(() => vi.unstubAllEnvs());

describe("[F0-19][AC-03] dev-preview production guard", () => {
  it.each(DEV_PREVIEW_PATHS)(
    "[F0-19][AC-03] T-03 returns 404 for %s in production",
    async (path) => {
      vi.stubEnv("NODE_ENV", "production");
      const response = await proxy(request(path));
      expect(response.headers.get("x-middleware-rewrite")).toMatch(/\/not-found$/);
    },
  );

  it("[F0-19][AC-03] T-03 also guards nested dev-preview paths in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await proxy(request("/dev-preview-calendar-kit/anything"));
    expect(response.headers.get("x-middleware-rewrite")).toBeTruthy();
  });

  it("[F0-19][AC-03] T-03 guards a trailing slash in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await proxy(request("/dev-preview/"));
    expect(response.headers.get("x-middleware-rewrite")).toMatch(/\/not-found$/);
  });

  it("[F0-19][AC-03] T-03 does not rewrite a non-route like /dev-preview.png", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await proxy(request("/dev-preview.png"));
    expect(response.headers.get("x-session")).toBe("1");
  });

  it.each(["development", "test"])(
    "[F0-19][AC-04] T-03 leaves previews alone in %s",
    async (env) => {
      vi.stubEnv("NODE_ENV", env);
      const response = await proxy(request("/dev-preview"));
      expect(response.headers.get("x-session")).toBe("1");
    },
  );

  it("[F0-19][AC-03] T-03 does not block similarly named real routes in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await proxy(request("/admin/dev-previews"));
    expect(response.headers.get("x-session")).toBe("1");
  });
});
