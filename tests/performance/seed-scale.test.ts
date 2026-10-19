import { describe, expect, it } from "vitest";

import { assertLocalUrl, buildScaleRows, percentile95 } from "../../scripts/seed-scale";

describe("INT-07 scale harness", () => {
  it("[INT-07][AC-01] creates exactly 50 clients with 500 recurring events each", () => {
    const rows = buildScaleRows();
    expect(rows.clients).toHaveLength(50);
    expect(rows.events).toHaveLength(25_000);
    expect(new Set(rows.events.map((row) => row.id)).size).toBe(25_000);
    for (const client of rows.clients) {
      expect(rows.events.filter((row) => row.client_id === client.id)).toHaveLength(500);
    }
    expect(new Set(rows.events.map((row) => row.recurrence.frequency))).toEqual(
      new Set(["daily", "weekly", "monthly", "yearly"]),
    );
    expect(rows.events.every((row) => row.starts_at.startsWith("2016-"))).toBe(true);
  });

  it("[INT-07][AC-01] refuses hosted or malformed database targets", () => {
    expect(() => assertLocalUrl("http://127.0.0.1:54321")).not.toThrow();
    expect(() => assertLocalUrl("http://localhost:54321")).not.toThrow();
    for (const url of [
      "https://project.supabase.co",
      "http://localhost.example:54321",
      "",
      "http://127.0.0.1:54321@remote.example",
    ]) {
      expect(() => assertLocalUrl(url)).toThrow();
    }
  });

  it("[INT-07][AC-01] uses the nineteenth ordered value as p95 of twenty samples", () => {
    expect(percentile95(Array.from({ length: 20 }, (_, i) => 20 - i))).toBe(19);
    expect(() => percentile95([])).toThrow();
    expect(() => percentile95([Number.NaN])).toThrow();
  });
});
