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

  it("[FAM-UI-05][PRD] every entry is against a bucket its client has", () => {
    for (const entry of FUND_ENTRIES) {
      const kinds = (RAW_BUDGET_BUCKETS_BY_CLIENT_ID[entry.clientId] ?? []).map(
        (bucket) => bucket.kind,
      );

      expect(kinds).toContain(entry.bucketKind);
    }
  });

  it("[FAM-UI-05][PRD] a top-up is a positive amount and an expense a negative one", () => {
    for (const entry of FUND_ENTRIES) {
      if (entry.type === "topup") expect(entry.amount).toBeGreaterThan(0);
      else expect(entry.amount).toBeLessThan(0);
    }
  });

  it("[FAM-UI-05][AC-02] Margaret has exactly the three top-ups the design draws", () => {
    const margaret = FUND_ENTRIES.filter((entry) => entry.clientId === MARGARET_CLIENT_ID);

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

  it("[FAM-UI-05][PRD] another client has an entry of their own, so client scoping is testable", () => {
    const others = FUND_ENTRIES.filter((entry) => entry.clientId !== MARGARET_CLIENT_ID);

    expect(others.length).toBeGreaterThan(0);
  });
});
