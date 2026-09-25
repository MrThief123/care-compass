// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  CLIENTS,
  FAMILY_PROFILES,
  FUND_ENTRIES,
  MARGARET_CLIENT_ID,
  RAW_BUDGET_BUCKETS_BY_CLIENT_ID,
  STAFF_MEMBERS,
} from "@/mocks/fixtures";
import { FundEntrySchema } from "@/types/domain";

describe("[FAM-UI-05][PRD] FUND_ENTRIES fixtures (CHG-019)", () => {
  it("[FAM-UI-05][PRD] every entry is valid against the domain schema, and ids are unique", () => {
    FUND_ENTRIES.forEach((entry) => FundEntrySchema.parse(entry));

    const ids = FUND_ENTRIES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("[FAM-UI-05][PRD] every entry belongs to a fixture client", () => {
    const clientIds = new Set(CLIENTS.map((client) => client.id));

    for (const entry of FUND_ENTRIES) {
      expect(clientIds.has(entry.clientId)).toBe(true);
    }
  });

  it("[FAM-UI-05][PRD] every entry is against a bucket its client has, by the bucket's id (CHG-021)", () => {
    for (const entry of FUND_ENTRIES) {
      expect(entry.bucketId).toBeTruthy();
      const bucket = (RAW_BUDGET_BUCKETS_BY_CLIENT_ID[entry.clientId] ?? []).find(
        (candidate) => candidate.id === entry.bucketId,
      );

      expect(bucket).toBeDefined();
      // An entry that also names a kind names its bucket's kind.
      if (entry.bucketKind) expect(entry.bucketKind).toBe(bucket!.kind);
    }
  });

  it("[FAM-UI-05][PRD] every fixture bucket has an id, unique across all clients (CHG-021)", () => {
    const ids = Object.values(RAW_BUDGET_BUCKETS_BY_CLIENT_ID)
      .flat()
      .map((bucket) => bucket.id);

    expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("[FAM-UI-05][PRD] a top-up is a positive amount and an expense a negative one", () => {
    for (const entry of FUND_ENTRIES) {
      if (entry.type === "topup") expect(entry.amount).toBeGreaterThan(0);
      else expect(entry.amount).toBeLessThan(0);
    }
  });

  it("[FAM-UI-05][AC-02] Margaret's paid entries are exactly the three top-ups the design draws", () => {
    // CHG-020: her pending cost is covered by its own test below.
    const margaret = FUND_ENTRIES.filter(
      (entry) => entry.clientId === MARGARET_CLIENT_ID && !entry.pending,
    );

    expect(
      margaret
        .map((entry) => [
          entry.date,
          entry.bucketKind,
          entry.type,
          entry.amount,
          entry.description,
          entry.recordedBy,
        ])
        .sort()
        .reverse(),
    ).toEqual([
      ["2026-11-03", "ndis", "topup", 6000, "NDIS quarterly plan top-up", "Helen Doyle"],
      ["2026-10-15", "fixed", "topup", 1000, "Fixed funding top-up", "Helen Doyle"],
      ["2026-10-01", "government", "topup", 750, "Government subsidy payment", "Helen Doyle"],
    ]);
  });

  it("[FAM-UI-05][PRD] every entry names who recorded it (PD-034), and that person is one the fixtures have", () => {
    const people = new Set(
      [...FAMILY_PROFILES, ...STAFF_MEMBERS].map(
        (person) => `${person.firstName} ${person.lastName}`,
      ),
    );

    for (const entry of FUND_ENTRIES) {
      expect(entry.recordedBy?.trim()).toBeTruthy();
      expect(people.has(entry.recordedBy!)).toBe(true);
    }
  });

  it("[FAM-UI-05][AC-07] Margaret has one pending cost: Physiotherapy, $310 on Government, more than its $240 (CHG-020)", () => {
    const pending = FUND_ENTRIES.filter((entry) => entry.pending);

    expect(pending).toEqual([
      expect.objectContaining({
        clientId: MARGARET_CLIENT_ID,
        bucketId: "bucket-margaret-government",
        bucketKind: "government",
        type: "expense",
        amount: -310,
        date: "2026-10-27",
        description: "Physiotherapy",
        recordedBy: "Aisha Rahman",
      }),
    ]);

    const government = RAW_BUDGET_BUCKETS_BY_CLIENT_ID[MARGARET_CLIENT_ID]!.find(
      (bucket) => bucket.kind === "government",
    )!;
    expect(-pending[0]!.amount).toBeGreaterThan(government.total - government.used);
  });

  it("[FAM-UI-05][PRD] a pending entry is always an expense (PD-058: only a cost can be pending)", () => {
    for (const entry of FUND_ENTRIES.filter((e) => e.pending)) {
      expect(entry.type).toBe("expense");
    }
  });

  it("[FAM-UI-05][PRD] another client has an entry of their own, so client scoping is testable", () => {
    const others = FUND_ENTRIES.filter((entry) => entry.clientId !== MARGARET_CLIENT_ID);

    expect(others.length).toBeGreaterThan(0);
  });
});
