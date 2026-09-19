import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { taskDetailHref } from "@/features/family-task-log/task-routes";

import TaskDetailPage from "./page";

const MORNING_MEDICATION_KEY = "event-margaret-morning-meds:2026-11-30T09:00:00+11:00";

function props(clientId: string, occurrenceKey: string) {
  return { params: Promise.resolve({ clientId, occurrenceKey }) };
}

describe("[FAM-UI-07] /family/[clientId]/tasks/[occurrenceKey] page (real mock contract, DATA_SOURCE=mock)", () => {
  it("[FAM-UI-07][AC-04] renders the Morning medication detail from the contract: Done · Aisha Rahman with a completion time", async () => {
    const encodedKey = taskDetailHref("client-margaret", MORNING_MEDICATION_KEY).split("/").pop()!;

    render(await TaskDetailPage(props("client-margaret", encodedKey)));

    expect(
      screen.getByRole("heading", { level: 1, name: "Morning medication" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Done · Aisha Rahman")).toBeInTheDocument();
    expect(screen.getByText(/^Completed at \d{2}:\d{2}$/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Task log" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks",
    );
  });

  it("[FAM-UI-07][PRD] resolves a key that arrives already decoded", async () => {
    render(await TaskDetailPage(props("client-margaret", MORNING_MEDICATION_KEY)));

    expect(
      screen.getByRole("heading", { level: 1, name: "Morning medication" }),
    ).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows the Documents card's empty state until a documents contract exists (FD-04)", async () => {
    render(await TaskDetailPage(props("client-margaret", MORNING_MEDICATION_KEY)));

    expect(screen.getByRole("region", { name: "Documents" })).toHaveTextContent(
      "No documents attached.",
    );
  });

  it("[FAM-UI-07][PRD] an unknown occurrence key renders the route's not-found page (404)", async () => {
    await expect(
      TaskDetailPage(props("client-margaret", "no-such-event:2026-01-01T00:00:00+11:00")),
    ).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });

  it("[FAM-UI-07][PRD] a key that belongs to another client is not found (404)", async () => {
    await expect(
      TaskDetailPage(props("client-robert", MORNING_MEDICATION_KEY)),
    ).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });
});
