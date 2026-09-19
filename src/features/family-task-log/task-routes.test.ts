import { describe, expect, it } from "vitest";

import { decodeOccurrenceKey, editEventHref, taskDetailHref, taskLogHref } from "./task-routes";

const KEY = "event-margaret-morning-meds:2026-11-30T09:00:00+11:00";

describe("task routes (ARCHITECTURE.md §3.1)", () => {
  it("[FAM-UI-07][PRD] the Task log lives at /family/[clientId]/tasks", () => {
    expect(taskLogHref("client-margaret")).toBe("/family/client-margaret/tasks");
  });

  it("[FAM-UI-07][PRD] a Task detail lives at /family/[clientId]/tasks/[occurrenceKey], with the key URL-encoded", () => {
    expect(taskDetailHref("client-margaret", KEY)).toBe(
      "/family/client-margaret/tasks/event-margaret-morning-meds%3A2026-11-30T09%3A00%3A00%2B11%3A00",
    );
  });

  it("[FAM-UI-07][PRD] the Edit link targets the edit-event route for the occurrence's event", () => {
    expect(editEventHref("client-margaret", "event-margaret-morning-meds")).toBe(
      "/family/client-margaret/events/event-margaret-morning-meds/edit",
    );
  });
});

describe("decodeOccurrenceKey", () => {
  it("[FAM-UI-07][PRD] round-trips an encoded key back to the contract key", () => {
    const encoded = taskDetailHref("client-margaret", KEY).split("/").pop() ?? "";

    expect(decodeOccurrenceKey(encoded)).toBe(KEY);
  });

  it("[FAM-UI-07][PRD] leaves a key that is already decoded unchanged (params may arrive either way)", () => {
    expect(decodeOccurrenceKey(KEY)).toBe(KEY);
  });

  it("[FAM-UI-07][PRD] returns a malformed percent sequence as given instead of throwing", () => {
    expect(decodeOccurrenceKey("100%")).toBe("100%");
  });
});
