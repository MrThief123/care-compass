import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { removeClient } from "@/server/admin/clients-actions";
import { getAdminClients } from "@/server/admin/clients-queries";

/*
 * ADM-05: `removeClient` in mock mode (the real path is covered by supabase/tests/admin_client_remove.test.sql
 * and tests/integration/admin-client-remove.test.ts). The mock store keeps a module-scoped copy of the
 * Admin client fixture, so each test removes a different client.
 */
beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("[ADM-05][AC-06] removeClient (mock mode)", () => {
  it("[ADM-05][AC-06] removes the client, and getAdminClients no longer lists them", async () => {
    const before = await getAdminClients();
    const target = before.clients.find((client) => client.id === "robert");
    if (!target) throw new Error("expected Robert Hale in the mock clients");

    const result = await removeClient("robert");

    expect(result).toEqual({ ok: true, data: { id: "robert" } });
    const after = await getAdminClients();
    expect(after.clients.find((client) => client.id === "robert")).toBeUndefined();
    expect(after.clients).toEqual(before.clients.filter((client) => client.id !== "robert"));
  });

  it("[ADM-05][AC-06] removing the same client again is NOT_FOUND, and removes nobody else", async () => {
    await removeClient("elsie");
    const afterFirst = await getAdminClients();

    const again = await removeClient("elsie");

    expect(again).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(await getAdminClients()).toEqual(afterFirst);
  });

  it("[ADM-05][AC-06] rejects a blank id with VALIDATION", async () => {
    expect(await removeClient("  ")).toMatchObject({
      ok: false,
      error: { code: "VALIDATION" },
    });
  });

  it("[ADM-05][AC-06] returns NOT_FOUND for an unknown client", async () => {
    expect(await removeClient("client-does-not-exist")).toMatchObject({
      ok: false,
      error: { code: "NOT_FOUND" },
    });
  });
});
