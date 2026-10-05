import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/server/data-source", () => ({ getDataSourceMode: () => "mock" }));
vi.mock("@/mocks/current-user", () => ({
  getCurrentUser: async () => ({ firstName: "Ada", lastName: "Carer" }),
}));
vi.mock("@/mocks/queries/events", () => ({
  setOccurrenceDone: async () => ({ occurrence: { completedAt: "2026-10-05T01:00:00.000Z" } }),
  setOccurrenceUndone: async () => undefined,
}));

import { setOccurrenceDone, setOccurrenceUndone } from "./actions";

describe("a tick or untick drops cached pages so Budget and the calendar show it", () => {
  beforeEach(() => revalidatePath.mockClear());

  it("revalidates after a successful tick", async () => {
    const result = await setOccurrenceDone("evt:2026-10-05T01:00:00.000Z");
    expect(result.ok).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("revalidates after a successful untick", async () => {
    const result = await setOccurrenceUndone("evt:2026-10-05T01:00:00.000Z");
    expect(result.ok).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
