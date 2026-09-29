import { afterEach, expect, it, vi } from "vitest";

import { getAdminClients } from "@/server/admin/clients-queries";
afterEach(() => vi.unstubAllEnvs());
it("[ADM-UI-04][AC-01] returns synthetic client/contact pairs without shared mutations", async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  const first = await getAdminClients();
  expect(first.clients).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: "Margaret Doyle", familyContact: "Helen Doyle" }),
      expect.objectContaining({ name: "Doris Petrov", familyContact: "Tom Petrov" }),
    ]),
  );
  const firstClient = first.clients[0];
  if (!firstClient) throw new Error("Expected a fixture client");
  firstClient.name = "Changed";
  expect((await getAdminClients()).clients[0]?.name).toBe("Margaret Doyle");
});
// [ADM-04]: getAdminClients' Supabase branch replaced the not-implemented stub. Its org-scoping and
// family-contact mapping are covered by tests/integration/admin-clients.test.ts against a real
// database — see feature DECISIONS.md FD-02.
