import { describe, expect, it } from "vitest";

import { adminClientBase, adminClientScreens } from "./client-routes";

describe("[ADM-11][AC-01] adminClientBase", () => {
  it("[ADM-11][AC-01] is /admin/clients/<id>", () => {
    expect(adminClientBase("b1111111-1111-1111-1111-111111111111")).toBe(
      "/admin/clients/b1111111-1111-1111-1111-111111111111",
    );
  });

  it("[ADM-11][AC-02] encodes the id", () => {
    expect(adminClientBase("a b/c")).toBe("/admin/clients/a%20b%2Fc");
  });
});

describe("[ADM-11][AC-02] adminClientScreens", () => {
  it("[ADM-11][AC-02] lists Home, Info, Calendar, Budget and Care log under the client", () => {
    expect(adminClientScreens("c1")).toEqual([
      { label: "Home", href: "/admin/clients/c1/home" },
      { label: "Info", href: "/admin/clients/c1/info" },
      { label: "Calendar", href: "/admin/clients/c1/calendar" },
      { label: "Budget", href: "/admin/clients/c1/budget" },
      { label: "Care log", href: "/admin/clients/c1/tasks" },
    ]);
  });

  it("[ADM-11][AC-02] has no Settings entry (Family Settings is out of scope)", () => {
    expect(adminClientScreens("c1").map((screen) => screen.label)).not.toContain("Settings");
  });
});
