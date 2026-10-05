import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

import { expect, test } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";

import { ensureScaleSeed, percentile95, SCALE_PASSWORD } from "../../scripts/seed-scale";

process.loadEnvFile(".env.local");

for (const [name, path] of [
  ["Home", "home"],
  ["Calendar week", "calendar?view=week&date=2026-09-28"],
  ["Task log first page", "tasks?page=1"],
] as const) {
  test(`[INT-07][AC-01][PRD] ${name} local server response p95 is below 1000 ms`, async ({
    context,
  }, testInfo) => {
    const seed = await ensureScaleSeed();
    const cookies = new Map<string, string>();
    const session = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
          setAll: (values) => values.forEach(({ name, value }) => cookies.set(name, value)),
        },
      },
    );
    const signedIn = await session.auth.signInWithPassword({
      email: seed.familyEmail,
      password: SCALE_PASSWORD,
    });
    if (signedIn.error) throw signedIn.error;
    await context.addCookies(
      [...cookies].map(([name, value]) => ({ name, value, url: "http://127.0.0.1:3267" })),
    );
    const route = `/family/${seed.clientId}/${path}`;
    const samples: number[] = [];
    await mkdir("test-results/int07", { recursive: true });
    for (let index = -1; index < 20; index++) {
      const start = performance.now();
      const response = await context.request.get(route, { timeout: 120_000, maxRedirects: 0 });
      const html = await response.text();
      const elapsed = performance.now() - start;
      expect(response.status()).toBe(200);
      expect(html).toContain("Scale care");
      expect(html).not.toMatch(/Something went wrong|Couldn't load|could not load home data/i);
      if (index >= 0) samples.push(elapsed);
      const result = {
        name,
        route,
        dataset: seed,
        warmupExcluded: 1,
        samplesMs: samples,
        completedSamples: samples.length,
        plannedSamples: 20,
        p95Ms: samples.length === 20 ? percentile95(samples) : null,
        budgetMs: 1000,
        measurement:
          "Authenticated full HTTP response on loopback, including server render and transfer; excludes browser hydration",
      };
      await writeFile(
        `test-results/int07/render-${path.split("?")[0]}.json`,
        JSON.stringify(result, null, 2),
      );
      // Two slow samples make the nineteenth sorted value of twenty >= budget,
      // even if every remaining sample were instantaneous. Preserve those samples
      // and fail without spending many minutes completing an already-failed run.
      expect(
        samples.filter((duration) => duration >= 1000).length,
        "At least two responses exceed the budget; a passing 20-sample p95 is impossible",
      ).toBeLessThan(2);
    }
    await testInfo.attach("timings", {
      body: JSON.stringify(samples),
      contentType: "application/json",
    });
    expect(samples).toHaveLength(20);
    expect(percentile95(samples)).toBeLessThan(1000);
  });
}
