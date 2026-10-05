import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("[F0-21][FD-11] browsers are told to use HTTPS only", () => {
  it("[F0-21][FD-11] sends Strict-Transport-Security on every route", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const allRoutes = rules.find((rule) => rule.source === "/:path*");
    const hsts = allRoutes?.headers.find((h) => h.key === "Strict-Transport-Security");

    expect(hsts?.value).toBe("max-age=63072000");
  });
});

describe("client router cache", () => {
  it("keeps visited pages for a short time so switching pages does not refetch", () => {
    expect(nextConfig.experimental?.staleTimes?.dynamic).toBeGreaterThan(0);
  });
});
