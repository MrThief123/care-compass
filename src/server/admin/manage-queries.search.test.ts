import { afterEach, describe, expect, it, vi } from "vitest";

import { getAdminManage } from "./manage-queries";

afterEach(() => vi.unstubAllEnvs());

describe("[ADM-06] getAdminManage search", () => {
  it("[ADM-06][AC-03] T-07 a staff search of 'Sar' lists only Sarah Nguyen", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const data = await getAdminManage({ staffSearch: "Sar" });
    expect(data.staff.map((person) => person.name)).toEqual(["Sarah Nguyen"]);
    expect(data.clients).toHaveLength(5);
  });

  it("[ADM-06][AC-03] T-07 the match is case-insensitive and also matches the last name", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    expect((await getAdminManage({ staffSearch: "nguyen" })).staff).toHaveLength(1);
  });

  it("[ADM-06][AC-03] T-07 a client search filters only the clients", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const data = await getAdminManage({ clientSearch: "Marg" });
    expect(data.clients.map((person) => person.name)).toEqual(["Margaret Doyle"]);
    expect(data.staff).toHaveLength(5);
  });

  it("[ADM-06][AC-03] T-07 a blank or missing search returns everyone", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    expect((await getAdminManage({ staffSearch: "  " })).staff).toHaveLength(5);
    expect((await getAdminManage()).staff).toHaveLength(5);
  });
});
