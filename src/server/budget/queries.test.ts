// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MARGARET_CLIENT_ID, ROBERT_CLIENT_ID } from "@/mocks/fixtures";
import { getBudgetSummary, getFundHistory } from "@/server/budget/queries";
import { FundEntrySchema } from "@/types/domain";

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("[FAM-UI-05][AC-01] getBudgetSummary (the three cards' data)", () => {
  it("[FAM-UI-05][AC-01] gives Margaret NDIS $14,880, Fixed $2,750 and Government $240 remaining, in that order", async () => {
    const buckets = await getBudgetSummary(MARGARET_CLIENT_ID);

    expect(buckets.map((bucket) => [bucket.label, bucket.remaining, bucket.total])).toEqual([
      ["NDIS", 14880, 24000],
      ["Fixed", 2750, 5000],
      ["Government", 240, 3000],
    ]);
    expect(buckets.map((bucket) => bucket.percentUsed)).toEqual([38, 45, 92]);
  });

  it("[FAM-UI-05][AC-01] Government is past the alert threshold (PD-032: 85%), so its card warns", async () => {
    const buckets = await getBudgetSummary(MARGARET_CLIENT_ID);

    expect(buckets.map((bucket) => bucket.state)).toEqual(["ok", "ok", "alert"]);
  });
});

describe("[FAM-UI-05][AC-02] getFundHistory (CHG-019)", () => {
  it("[FAM-UI-05][AC-02] returns Margaret's entries newest first, the first being 3 Nov 2026 'NDIS quarterly plan top-up' +$6,000", async () => {
    const history = await getFundHistory(MARGARET_CLIENT_ID);

    expect(history[0]).toMatchObject({
      date: "2026-11-03",
      description: "NDIS quarterly plan top-up",
      amount: 6000,
      type: "topup",
      bucketKind: "ndis",
      recordedBy: "Helen Doyle",
    });
  });

  it("[FAM-UI-05][AC-02] returns the three rows the design draws, word for word, in the design's order", async () => {
    const history = await getFundHistory(MARGARET_CLIENT_ID);

    expect(history.map((entry) => [entry.date, entry.description, entry.amount])).toEqual([
      ["2026-11-03", "NDIS quarterly plan top-up", 6000],
      ["2026-10-15", "Fixed funding top-up", 1000],
      ["2026-10-01", "Government subsidy payment", 750],
    ]);
    expect(history.map((entry) => entry.bucketKind)).toEqual(["ndis", "fixed", "government"]);
  });

  it("[FAM-UI-05][AC-02] names who recorded each entry, for the screen's 'Recorded by' line (PD-034, FD-05)", async () => {
    for (const clientId of [MARGARET_CLIENT_ID, ROBERT_CLIENT_ID]) {
      const history = await getFundHistory(clientId);

      expect(history.length).toBeGreaterThan(0);
      for (const entry of history) expect(entry.recordedBy?.trim()).toBeTruthy();
    }

    const margaret = await getFundHistory(MARGARET_CLIENT_ID);
    expect(margaret.map((entry) => entry.recordedBy)).toEqual([
      "Helen Doyle",
      "Helen Doyle",
      "Helen Doyle",
    ]);
  });

  it("[FAM-UI-05][PRD] is ordered newest date first, whatever the fixtures' own order", async () => {
    for (const clientId of [MARGARET_CLIENT_ID, ROBERT_CLIENT_ID]) {
      const dates = (await getFundHistory(clientId)).map((entry) => entry.date);

      expect(dates).toEqual([...dates].sort().reverse());
    }
  });

  it("[FAM-UI-05][PRD] returns valid fund entries", async () => {
    const history = await getFundHistory(MARGARET_CLIENT_ID);

    expect(history.length).toBeGreaterThan(0);
    history.forEach((entry) => FundEntrySchema.parse(entry));
  });

  it("[FAM-UI-05][PRD] returns only the requested client's entries, never another client's", async () => {
    const margaret = await getFundHistory(MARGARET_CLIENT_ID);
    const robert = await getFundHistory(ROBERT_CLIENT_ID);

    expect(margaret.every((entry) => entry.clientId === MARGARET_CLIENT_ID)).toBe(true);
    expect(robert.length).toBeGreaterThan(0);
    expect(robert.every((entry) => entry.clientId === ROBERT_CLIENT_ID)).toBe(true);

    const margaretIds = new Set(margaret.map((entry) => entry.id));
    expect(robert.some((entry) => margaretIds.has(entry.id))).toBe(false);
  });

  it("[FAM-UI-05][AC-03] returns an empty array for an unknown client, so the screen can show its empty state", async () => {
    expect(await getFundHistory("client-does-not-exist")).toEqual([]);
    expect(await getFundHistory("")).toEqual([]);
  });

  it("[FAM-UI-05][PRD] object-prototype names are unknown clients, not errors", async () => {
    for (const name of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      expect(await getFundHistory(name)).toEqual([]);
    }
  });

  it("[FAM-UI-05][PRD] does not let a caller change the fixtures by editing what it was given", async () => {
    const first = await getFundHistory(MARGARET_CLIENT_ID);
    first[0]!.description = "changed";
    first[0]!.amount = 1;
    first.reverse();

    const second = await getFundHistory(MARGARET_CLIENT_ID);

    expect(second[0]).toMatchObject({ description: "NDIS quarterly plan top-up", amount: 6000 });
    expect(second.map((entry) => entry.date)).toEqual(["2026-11-03", "2026-10-15", "2026-10-01"]);
  });
});

describe("[FAM-UI-05][PRD] supabase mode", () => {
  it("[FAM-UI-05][PRD] getFundHistory throws the not-implemented error naming its domain and function", async () => {
    vi.stubEnv("DATA_SOURCE", "supabase");

    await expect(getFundHistory(MARGARET_CLIENT_ID)).rejects.toThrow(
      /budget\.getFundHistory: DATA_SOURCE="supabase" is not implemented yet/,
    );
  });
});
