import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getOccurrence = vi.hoisted(() => vi.fn());
const getEventDocuments = vi.hoisted(() => vi.fn());

vi.mock("@/server/events/queries", () => ({ getOccurrence }));
vi.mock("@/server/documents/queries", () => ({ getEventDocuments }));

import { makeHistory } from "@/features/family-task-log/fake-task-log";
import type { EventDocument, Occurrence } from "@/types/domain";

import TaskDetailPage from "./page";

const ID = "client-margaret";

function props(occurrenceKey: string) {
  return {
    params: Promise.resolve({ clientId: ID, occurrenceKey }),
    searchParams: Promise.resolve({}),
  };
}

/** A task months after every page of the log, which no paging over `getTaskLog` could ever find. */
const FUTURE: Occurrence = {
  ...makeHistory(1)[0]!,
  key: "event-margaret-physio:2027-03-15T11:30:00+11:00",
  eventId: "event-margaret-physio",
  title: "Physiotherapy",
  start: "2027-03-15T11:30:00+11:00",
  status: "planned",
  actor: undefined,
  completedAt: undefined,
  assignee: "Aisha Rahman",
};

function document(overrides: Partial<EventDocument> = {}): EventDocument {
  return {
    id: "doc-1",
    clientId: ID,
    eventId: FUTURE.eventId,
    name: "Physio referral.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
    uploadedAt: "2026-10-12T10:15:00+11:00",
    ...overrides,
  };
}

describe("[FAM-UI-07] Task detail page edge cases (contract stubbed)", () => {
  beforeEach(() => {
    getOccurrence.mockReset();
    getEventDocuments.mockReset();
    getOccurrence.mockResolvedValue(FUTURE);
    getEventDocuments.mockResolvedValue([]);
  });

  it("[FAM-UI-07][AC-04] opens a future task through getOccurrence, without looking the task up in the log", async () => {
    render(await TaskDetailPage(props(encodeURIComponent(FUTURE.key))));

    expect(getOccurrence).toHaveBeenCalledExactlyOnceWith(ID, FUTURE.key);
    expect(screen.getByRole("heading", { level: 1, name: "Physiotherapy" })).toBeInTheDocument();
    expect(screen.getByText("Monday 15 March 2027 · Assigned to Aisha Rahman")).toBeInTheDocument();
    expect(screen.getByText("Planned")).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] reads the documents of the task's own event, for the same client", async () => {
    getEventDocuments.mockResolvedValue([document()]);

    render(await TaskDetailPage(props(encodeURIComponent(FUTURE.key))));

    expect(getEventDocuments).toHaveBeenCalledExactlyOnceWith(ID, "event-margaret-physio");
    expect(
      within(screen.getByRole("region", { name: "Documents" })).getByText("Physio referral.pdf"),
    ).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows many documents at once, each with its own name, type and size", async () => {
    getEventDocuments.mockResolvedValue(
      Array.from({ length: 25 }, (_, index) =>
        document({
          id: `doc-${index}`,
          name: `Referral letter ${index + 1}.pdf`,
          sizeBytes: 1024 * (index + 1),
        }),
      ),
    );

    render(await TaskDetailPage(props(encodeURIComponent(FUTURE.key))));

    const card = screen.getByRole("region", { name: "Documents" });
    expect(within(card).getAllByRole("listitem")).toHaveLength(25);
    expect(within(card).getByText("PDF · 25.0 KB")).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] does not read documents for a task that does not exist", async () => {
    getOccurrence.mockResolvedValue(undefined);

    await expect(TaskDetailPage(props("nope"))).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
    expect(getEventDocuments).not.toHaveBeenCalled();
  });

  it("[FAM-UI-07][PRD] lets a failing task query reject so the route's error state shows", async () => {
    getOccurrence.mockRejectedValue(new Error("query failed"));

    await expect(TaskDetailPage(props("k"))).rejects.toThrow("query failed");
  });

  it("[FAM-UI-07][PRD] lets a failing documents query reject so the route's error state shows, rather than claiming there are none", async () => {
    getEventDocuments.mockRejectedValue(new Error("documents failed"));

    await expect(TaskDetailPage(props(encodeURIComponent(FUTURE.key)))).rejects.toThrow(
      "documents failed",
    );
  });
});
