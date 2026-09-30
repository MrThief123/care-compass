import { afterEach, expect, it, vi } from "vitest";

import { getAdminSettings } from "@/server/admin/settings-queries";
afterEach(() => vi.unstubAllEnvs());
it("[ADM-UI-05][AC-01] returns independent synthetic settings", async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  const first = await getAdminSettings();
  expect(first.organisation?.name).toBe("Banksia Home Care");
  if (!first.organisation) throw new Error("Expected fixture organisation");
  first.organisation.name = "Changed";
  expect((await getAdminSettings()).organisation?.name).toBe("Banksia Home Care");
});
it("[ADM-10][AC-01] live mode reads the signed-in admin's organisation, blanks for null columns", async () => {
  vi.stubEnv("DATA_SOURCE", "supabase");
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: async () => ({
      from: () => ({
        select: () => ({
          limit: () => ({
            maybeSingle: async () => ({
              data: {
                name: "Banksia Home Care",
                abn: "54 123 456 789",
                phone: null,
                address: null,
              },
              error: null,
            }),
          }),
        }),
      }),
    }),
  }));
  const { getAdminSettings: live } = await import("@/server/admin/settings-queries");
  expect((await live()).organisation).toEqual({
    name: "Banksia Home Care",
    abn: "54 123 456 789",
    phone: "",
    address: "",
  });
  vi.doUnmock("@/lib/supabase/server");
});
