import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/events/queries", () => ({
  getTaskLog: vi.fn().mockRejectedValue(new Error("query failed")),
}));

import TasksPage from "./page";

describe("[FAM-UI-07] /family/[clientId]/tasks page, failing query", () => {
  it("[FAM-UI-07][PRD] lets a rejected getTaskLog propagate so the route's error boundary shows the error state", async () => {
    await expect(
      TasksPage({ params: Promise.resolve({ clientId: "client-margaret" }) }),
    ).rejects.toThrow("query failed");
  });
});
