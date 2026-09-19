import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { taskDetailHref } from "@/features/family-task-log/task-routes";
import { getTaskLog } from "@/server/events/queries";

import TaskDetailPage from "./page";

const ID = "client-margaret";
const MORNING_MEDICATION_KEY = "event-margaret-morning-meds:2026-11-30T09:00:00+11:00";

type SearchParams = Record<string, string | string[] | undefined>;

function props(clientId: string, occurrenceKey: string, searchParams: SearchParams = {}) {
  return {
    params: Promise.resolve({ clientId, occurrenceKey }),
    searchParams: Promise.resolve(searchParams),
  };
}

/** The last path segment of the detail route, as Next hands it to the page (encoded). */
const encoded = (clientId: string, key: string) => taskDetailHref(clientId, key).split("/").pop()!;

async function renderDetail(key: string, searchParams: SearchParams = {}, clientId = ID) {
  return render(await TaskDetailPage(props(clientId, encoded(clientId, key), searchParams)));
}

const documentsCard = () => screen.getByRole("region", { name: "Documents" });

describe("[FAM-UI-07] /family/[clientId]/tasks/[occurrenceKey] page (real mock contract, DATA_SOURCE=mock)", () => {
  it("[FAM-UI-07][AC-04] renders the Morning medication detail: Done · Aisha Rahman and Completed at 09:14", async () => {
    await renderDetail(MORNING_MEDICATION_KEY);

    expect(
      screen.getByRole("heading", { level: 1, name: "Morning medication" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Done · Aisha Rahman")).toBeInTheDocument();
    expect(screen.getByText("Completed at 09:14")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Task log" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks",
    );
  });

  it("[FAM-UI-07][PRD] resolves a key that arrives already decoded", async () => {
    render(await TaskDetailPage(props(ID, MORNING_MEDICATION_KEY)));

    expect(
      screen.getByRole("heading", { level: 1, name: "Morning medication" }),
    ).toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-08] 'Back to Task log' returns to the q, status and page the task was opened from", async () => {
    await renderDetail(MORNING_MEDICATION_KEY, { q: "medication", status: "done", page: "3" });

    expect(screen.getByRole("link", { name: "Back to Task log" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks?q=medication&status=done&page=3",
    );
  });

  it("[FAM-UI-07][AC-08] hostile view params are cleaned before they reach the Back link, and cannot change where it points", async () => {
    await renderDetail(MORNING_MEDICATION_KEY, {
      q: "  //evil.example/x?y=1#z  ",
      status: "bogus",
      page: "-3",
    });

    const href = screen.getByRole("link", { name: "Back to Task log" }).getAttribute("href")!;
    expect(href).toBe("/family/client-margaret/tasks?q=%2F%2Fevil.example%2Fx%3Fy%3D1%23z");
    expect(new URL(href, "https://app.example").origin).toBe("https://app.example");
    expect(new URL(href, "https://app.example").pathname).toBe("/family/client-margaret/tasks");
  });

  it("[FAM-UI-07][AC-08] a 5,000-character q in the URL is capped at 200 characters in the Back link", async () => {
    await renderDetail(MORNING_MEDICATION_KEY, { q: "a".repeat(5000), page: "abc" });

    const href = screen.getByRole("link", { name: "Back to Task log" }).getAttribute("href")!;
    expect(href).toBe(`/family/client-margaret/tasks?q=${"a".repeat(200)}`);
  });

  it("[FAM-UI-07][PRD] the Documents card shows 'Medication chart.pdf' with its type and size for the Morning medication", async () => {
    await renderDetail(MORNING_MEDICATION_KEY);

    expect(within(documentsCard()).getByText("Medication chart.pdf")).toBeInTheDocument();
    expect(within(documentsCard()).getByText("PDF · 82.3 KB")).toBeInTheDocument();
    expect(within(documentsCard()).queryByText("No documents attached.")).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] the Physiotherapy task shows both of its documents", async () => {
    await renderDetail("event-margaret-physio:2026-11-30T11:30:00+11:00");

    expect(within(documentsCard()).getByText("Physio referral.pdf")).toBeInTheDocument();
    expect(within(documentsCard()).getByText("Exercise plan.pdf")).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] the Wound dressing check shows its photo as a JPEG", async () => {
    await renderDetail("event-margaret-wound-dressing:2026-11-26T10:00:00+11:00");

    expect(within(documentsCard()).getByText("Wound photo 26 Nov.jpg")).toBeInTheDocument();
    expect(within(documentsCard()).getByText(/^JPEG · /)).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] the eye-drops task shows its 92-character document name cut to fit, the whole name still on hover", async () => {
    await renderDetail("event-margaret-eye-drops:2026-11-25T16:30:00+11:00");

    const tile = within(documentsCard()).getByText(/^Ophthalmologist letter/);
    expect(tile.textContent).toHaveLength(92);
    expect(tile).toHaveAttribute("title", tile.textContent);
  });

  it("[FAM-UI-07][PRD] a task whose event has no documents keeps the empty Documents state", async () => {
    await renderDetail("event-margaret-evening-meds:2026-11-29T18:00:00+11:00");

    expect(documentsCard()).toHaveTextContent("No documents attached.");
  });

  it("[FAM-UI-07][AC-04] any task in the history opens, including the oldest row on the last page of the log", async () => {
    const last = await getTaskLog(ID, { page: 7 });
    const oldest = last.items.at(-1)!;

    await renderDetail(oldest.key);

    expect(screen.getByRole("heading", { level: 1, name: oldest.title })).toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-04] every one of the 137 tasks in the log opens (none is 404 because it fell outside a page)", async () => {
    const keys: string[] = [];
    for (let page = 1; page <= 7; page += 1) {
      keys.push(...(await getTaskLog(ID, { page })).items.map((item) => item.key));
    }
    expect(keys).toHaveLength(137);

    for (const key of keys) {
      await expect(TaskDetailPage(props(ID, encoded(ID, key)))).resolves.toBeDefined();
    }
  });

  it("[FAM-UI-07][PRD] an unknown occurrence key renders the route's not-found page (404)", async () => {
    await expect(
      TaskDetailPage(props(ID, "no-such-event:2026-01-01T00:00:00+11:00")),
    ).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });

  it("[FAM-UI-07][PRD] a key that belongs to another client is not found (404)", async () => {
    await expect(
      TaskDetailPage(props("client-robert", MORNING_MEDICATION_KEY)),
    ).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });

  it.each(["", "%", "%E0%A4%A", "a".repeat(5000), "../../etc/passwd", "__proto__"])(
    "[FAM-UI-07][PRD] the odd key %j is a 404, never a crash",
    async (key) => {
      await expect(TaskDetailPage(props(ID, key.slice(0, 5000)))).rejects.toMatchObject({
        digest: "NEXT_HTTP_ERROR_FALLBACK;404",
      });
    },
  );
});
