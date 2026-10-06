import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

import { createServerClient } from "@supabase/ssr";
import { afterAll, beforeAll, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

import { ensureScaleSeed, percentile95, SCALE_PASSWORD } from "../../scripts/seed-scale";

process.loadEnvFile(".env.local");
let seed: Awaited<ReturnType<typeof ensureScaleSeed>>;
const cookies = new Map<string, string>();
const cookieList = () => [...cookies].map(([name, value]) => ({ name, value }));

beforeAll(async () => {
  seed = await ensureScaleSeed();
  const session = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: cookieList,
        setAll: (values) => values.forEach(({ name, value }) => cookies.set(name, value)),
      },
    },
  );
  const signedIn = await session.auth.signInWithPassword({
    email: seed.familyEmail,
    password: SCALE_PASSWORD,
  });
  if (signedIn.error) throw signedIn.error;
  vi.doMock("next/headers", () => ({
    cookies: async () => ({
      getAll: cookieList,
      set: (name: string, value: string) => cookies.set(name, value),
    }),
    headers: async () => new Headers({ host: "127.0.0.1:3267", "x-forwarded-proto": "http" }),
  }));
  vi.stubEnv("DATA_SOURCE", "supabase");
});

afterAll(() => {
  vi.doUnmock("next/headers");
  vi.unstubAllEnvs();
});

it("[INT-07][AC-01] Calendar week query p95 is below 1000 ms over twenty authenticated samples", async () => {
  const { getOccurrences } = await import("@/server/events/queries");
  const query = () => getOccurrences(seed.clientId, { from: "2026-09-28", to: "2026-10-04" });
  const warmup = await query();
  // 125 daily x 7 + 125 weekly, with monthly/yearly matches adding to these.
  expect(warmup.length).toBeGreaterThanOrEqual(1_000);
  expect(new Set(warmup.map((row) => row.key)).size).toBe(warmup.length);
  const samples: number[] = [];
  await mkdir("test-results/int07", { recursive: true });
  for (let index = 0; index < 20; index++) {
    const start = performance.now();
    const rows = await query();
    samples.push(performance.now() - start);
    expect(rows.length).toBe(warmup.length);
    await writeFile(
      "test-results/int07/calendar-query.json",
      JSON.stringify(
        {
          dataset: seed,
          range: { from: "2026-09-28", to: "2026-10-04" },
          warmupExcluded: 1,
          occurrenceCount: rows.length,
          samplesMs: samples,
          p95Ms: percentile95(samples),
          budgetMs: 1000,
        },
        null,
        2,
      ),
    );
  }
  expect(samples).toHaveLength(20);
  expect(percentile95(samples)).toBeLessThan(1000);
});
