import { afterEach, describe, expect, it, vi } from "vitest";

import { MARGARET_CLIENT_ID } from "@/mocks/fixtures";
import { getClientHeaderSummary } from "@/server/clients/queries";

describe("[F0-15] getClientHeaderSummary via the mock data source", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns Margaret's age (computed from dob), suburb and organisation name", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");

    const summary = await getClientHeaderSummary(MARGARET_CLIENT_ID);

    expect(summary).toMatchObject({
      firstName: "Margaret",
      lastName: "Doyle",
      age: 78,
      suburb: "Preston VIC",
      organisationName: "Banksia Home Care",
    });
  });

  it("throws for an unknown client id", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");

    await expect(getClientHeaderSummary("client-does-not-exist")).rejects.toThrow();
  });
});
