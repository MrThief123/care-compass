import { cleanup, render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import type { TaskLogParams } from "@/features/family-task-log/task-log-params";
import { getEventDocuments } from "@/server/documents/queries";
import { getOccurrence } from "@/server/events/queries";
import type { EventDocument, Occurrence } from "@/types/domain";

import type { TaskDetailOrigin } from "./task-detail-origin";
import { TaskDetailView } from "./task-detail-view";

const ID = "client-margaret";
const MORNING_MEDICATION_KEY = "event-margaret-morning-meds:2026-11-30T09:00:00+11:00";
const PLANNED_PHYSIO_KEY = "event-margaret-physio:2026-11-30T11:30:00+11:00";
const OVERDUE_WEIGH_IN_KEY = "event-margaret-weigh-in:2026-11-29T09:30:00+11:00";

/** A task and its documents, read through the real contract (mock data source). */
async function load(key: string) {
  const occurrence = (await getOccurrence(ID, key))!;
  const documents = await getEventDocuments(ID, occurrence.eventId);
  return { occurrence, documents };
}

async function renderDetail(
  key = MORNING_MEDICATION_KEY,
  extra: {
    occurrence?: Partial<Occurrence>;
    documents?: EventDocument[];
    backParams?: TaskLogParams;
    origin?: TaskDetailOrigin;
  } = {},
) {
  const loaded = await load(key);
  return render(
    <TaskDetailView
      clientId={ID}
      occurrence={{ ...loaded.occurrence, ...extra.occurrence }}
      documents={extra.documents ?? loaded.documents}
      origin={extra.origin ?? (extra.backParams && { from: "tasks", view: extra.backParams })}
    />,
  );
}

describe("[FAM-UI-07] TaskDetailView", () => {
  it("[FAM-UI-07][AC-04] shows 'Done · Aisha Rahman' and 'Completed at 09:14' for the Morning medication", async () => {
    await renderDetail();

    const statusCard = screen.getByRole("region", { name: "Status" });
    expect(within(statusCard).getByText("Done · Aisha Rahman")).toBeInTheDocument();
    expect(within(statusCard).getByText("Completed at 09:14")).toBeInTheDocument();
  });

  it("[FAM-UI-07][AC-04] shows the title and 'Monday 30 November 2026 · Assigned to Aisha Rahman'", async () => {
    await renderDetail();

    expect(
      screen.getByRole("heading", { level: 1, name: "Morning medication" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Monday 30 November 2026 · Assigned to Aisha Rahman"),
    ).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] links 'Back to Task log' to the plain Task log when opened without a view", async () => {
    await renderDetail();

    expect(screen.getByRole("link", { name: "Back to Task log" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks",
    );
  });

  it("[FAM-UI-07][AC-08] 'Back to Task log' returns to the same q, status and page", async () => {
    await renderDetail(MORNING_MEDICATION_KEY, {
      backParams: { q: "medication", status: "done", page: 3 },
    });

    expect(screen.getByRole("link", { name: "Back to Task log" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks?q=medication&status=done&page=3",
    );
  });

  it("[FAM-UI-07][PRD] shows the Description card, which no longer holds an Edit link (CHG-014: Edit event sits by the title)", async () => {
    await renderDetail();

    const card = screen.getByRole("region", { name: "Description" });
    expect(
      within(card).getByText(
        "Administer morning medication as per the current care plan. Confirm with Margaret before administering and record any side effects.",
      ),
    ).toBeInTheDocument();
    expect(within(card).queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit event" })).toHaveAttribute(
      "href",
      "/family/client-margaret/events/event-margaret-morning-meds/edit",
    );
  });

  it("[FAM-UI-07][PRD] shows the Documents card with a tile per document: name, type and size", async () => {
    await renderDetail();

    const card = screen.getByRole("region", { name: "Documents" });
    expect(within(card).getAllByRole("listitem")).toHaveLength(1);
    expect(within(card).getByText("Medication chart.pdf")).toBeInTheDocument();
    expect(within(card).getByText("PDF · 82.3 KB")).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows every document an event has, in the order the contract gives", async () => {
    await renderDetail(PLANNED_PHYSIO_KEY);

    const card = screen.getByRole("region", { name: "Documents" });
    expect(
      within(card)
        .getAllByRole("listitem")
        .map((item) => within(item).getByText(/\.pdf$/).textContent),
    ).toEqual(["Physio referral.pdf", "Exercise plan.pdf"]);
  });

  it("[FAM-UI-07][PRD] says so when the task has no documents", async () => {
    await renderDetail(MORNING_MEDICATION_KEY, { documents: [] });

    expect(screen.getByText("No documents attached.")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows only the Planned pill, and no completion time, for a planned task", async () => {
    await renderDetail(PLANNED_PHYSIO_KEY);

    expect(screen.getByText("Planned")).toBeInTheDocument();
    expect(screen.queryByText(/Completed at/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Monday 30 November 2026 · Assigned to Aisha Rahman"),
    ).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows the Overdue pill and 'Assigned to —' when no shift covers the task", async () => {
    await renderDetail(OVERDUE_WEIGH_IN_KEY);

    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.queryByText(/Completed at/)).not.toBeInTheDocument();
    expect(screen.getByText("Sunday 29 November 2026 · Assigned to —")).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] shows the actor, not the assignee, once someone else has completed the task", async () => {
    await renderDetail(MORNING_MEDICATION_KEY, { occurrence: { actor: "Sarah Nguyen" } });

    expect(screen.getByText("Done · Sarah Nguyen")).toBeInTheDocument();
    expect(
      screen.getByText("Monday 30 November 2026 · Assigned to Sarah Nguyen"),
    ).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] omits the completion time when a Done task has none recorded", async () => {
    await renderDetail(MORNING_MEDICATION_KEY, { occurrence: { completedAt: undefined } });

    expect(screen.getByText("Done · Aisha Rahman")).toBeInTheDocument();
    expect(screen.queryByText(/Completed at/)).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] renders a 120-character title, a long description and non-ASCII text in full", async () => {
    const longTitle = `Medication ${"administration and observation ".repeat(5)}`
      .trim()
      .slice(0, 120);
    const longDescription = "Confirm with the client before administering. ".repeat(20).trim();
    const nonAscii = "朝の投薬の確認 — Médicament du matin 🏃‍♀️";
    await renderDetail(MORNING_MEDICATION_KEY, {
      occurrence: { title: longTitle, description: `${longDescription}\n${nonAscii}` },
    });

    expect(longTitle).toHaveLength(120);
    expect(screen.getByRole("heading", { level: 1, name: longTitle })).toBeInTheDocument();
    expect(screen.getByText(longDescription, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(nonAscii, { exact: false })).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] has no axe violations for done, planned and overdue tasks, with and without documents", async () => {
    for (const key of [MORNING_MEDICATION_KEY, PLANNED_PHYSIO_KEY, OVERDUE_WEIGH_IN_KEY]) {
      const { container, unmount } = await renderDetail(key);
      expect(await axe(container)).toHaveNoViolations();
      unmount();
    }
  });
});

/**
 * The human's rule (2026-09-20): "Things should fit into their tabs and if too big then should
 * resize or get cutoff rather than overlap." jsdom has no layout, so these pin the classes that
 * make each measured cause impossible; the layout itself is proven by the real-browser width
 * sweep in PROGRESS.md (DECISIONS.md FD-21).
 */
describe("[FAM-UI-07] TaskDetailView: long text and narrow windows", () => {
  const classesOf = (element: Element) => [...element.classList];
  const NAME_NO_SPACES = "Alexandrina".repeat(6).slice(0, 60);
  const UNBROKEN_300 = `https://example.com/${"a".repeat(280)}`;
  const PROSE = "Confirm with the client before administering and record any side effects. ";

  function documentsNamed(names: string[]): EventDocument[] {
    return names.map((name, index) => ({
      id: `doc-${index}`,
      clientId: ID,
      eventId: "event-1",
      name,
      mimeType: "application/pdf",
      sizeBytes: 84312,
      uploadedAt: "2026-10-12T10:15:00+11:00",
    }));
  }

  it("[FAM-UI-07][PRD] lays the Documents out as a wrapping grid whose tiles are at least 10rem wide, so a name is not squeezed into 104px", async () => {
    await renderDetail(MORNING_MEDICATION_KEY, {
      documents: documentsNamed(["One.pdf", "Two.pdf", "Three.pdf"]),
    });

    const list = within(screen.getByRole("region", { name: "Documents" })).getByRole("list");
    expect(classesOf(list)).toContain("grid");
    expect(classesOf(list)).toContain(
      "grid-cols-[repeat(auto-fill,minmax(min(10rem,100%),12rem))]",
    );
    // No `flex-wrap` of fixed 104px tiles any more.
    expect(classesOf(list)).not.toContain("flex");
    for (const item of within(list).getAllByRole("listitem")) {
      expect(classesOf(item)).toContain("min-w-0");
    }
  });

  it("[FAM-UI-07][PRD] shows six documents, one with a 92-character name and one with a name that has no spaces, each in full in the DOM", async () => {
    const longName =
      "Ophthalmologist letter about post-operative eye drop schedule and follow-up appointments.pdf";
    const noSpaces = `${"Ophthalmologist".repeat(6)}.pdf`.slice(0, 92);
    const names = [
      "Medication chart.pdf",
      longName,
      noSpaces,
      "薬のリスト 🩺.pdf",
      "Care plan 2026.pdf",
      "Wound photo.jpg",
    ];
    await renderDetail(MORNING_MEDICATION_KEY, { documents: documentsNamed(names) });

    const card = screen.getByRole("region", { name: "Documents" });
    expect(within(card).getAllByRole("listitem")).toHaveLength(6);
    for (const name of names) {
      expect(within(card).getByText(name)).toHaveAttribute("title", name);
    }
  });

  it("[FAM-UI-07][PRD] lets the title and the 'Assigned to' line wrap anywhere, so a long name with no spaces cannot run past the page edge", async () => {
    await renderDetail(MORNING_MEDICATION_KEY, {
      occurrence: { title: "T".repeat(120), actor: NAME_NO_SPACES, assignee: NAME_NO_SPACES },
    });

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("T".repeat(120));
    expect(classesOf(heading)).toContain("[overflow-wrap:anywhere]");

    const line = screen.getByText(`Monday 30 November 2026 · Assigned to ${NAME_NO_SPACES}`);
    expect(classesOf(line)).toContain("[overflow-wrap:anywhere]");
  });

  it("[FAM-UI-07][PRD] caps the Status pill at its card: it may shrink, its label ends in an ellipsis, its icon keeps its size, and the whole text is on hover and in the DOM", async () => {
    await renderDetail(MORNING_MEDICATION_KEY, {
      occurrence: { actor: NAME_NO_SPACES, assignee: NAME_NO_SPACES },
    });

    const label = screen.getByText(`Done · ${NAME_NO_SPACES}`);
    expect(label.textContent).toBe(`Done · ${NAME_NO_SPACES}`);
    expect(classesOf(label)).toContain("truncate");
    const pill = label.parentElement!;
    expect(classesOf(pill)).toEqual(
      expect.arrayContaining(["max-w-full", "min-w-0", "[&>svg]:shrink-0"]),
    );
    const wrapper = pill.parentElement!;
    expect(wrapper).toHaveAttribute("title", `Done · ${NAME_NO_SPACES}`);
    expect(classesOf(wrapper)).toEqual(expect.arrayContaining(["min-w-0", "max-w-full"]));
  });

  it("[FAM-UI-07][PRD] draws the Status pill 26px tall like the Task log's, Done with a transparent border so all three statuses match", async () => {
    await renderDetail();
    const done = screen.getByText("Done · Aisha Rahman").parentElement!;
    expect(classesOf(done)).toEqual(expect.arrayContaining(["py-[3px]", "border-transparent"]));
    cleanup();

    await renderDetail(PLANNED_PHYSIO_KEY);
    const planned = screen.getByText("Planned");
    expect(classesOf(planned)).toContain("py-[3px]");
    expect(classesOf(planned)).not.toContain("border-transparent");
  });

  it("[FAM-UI-07][PRD] shows a 2,000-character description and an unbroken 300-character string in full: wrapped, never cut off, line breaks kept", async () => {
    const description = `${PROSE.repeat(28).slice(0, 2000)}\n${UNBROKEN_300}\nSecond line`;
    await renderDetail(MORNING_MEDICATION_KEY, { occurrence: { description } });

    const card = screen.getByRole("region", { name: "Description" });
    const paragraph = within(card).getByText(UNBROKEN_300, { exact: false });
    expect(paragraph.textContent).toBe(description);
    expect(classesOf(paragraph)).toEqual(
      expect.arrayContaining(["whitespace-pre-line", "[overflow-wrap:anywhere]"]),
    );
    // Whole text, not a preview: nothing clamps or truncates the description.
    expect(
      classesOf(paragraph).some((name) => /line-clamp|truncate|overflow-hidden/.test(name)),
    ).toBe(false);
  });

  it("[FAM-UI-07][PRD] keeps the Back link and the Edit event button when the text is long", async () => {
    await renderDetail(MORNING_MEDICATION_KEY, {
      occurrence: { title: "T".repeat(120), description: UNBROKEN_300, actor: NAME_NO_SPACES },
    });

    expect(screen.getByRole("link", { name: "Back to Task log" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit event" })).toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] has no axe violations with the longest text and six documents", async () => {
    const { container } = await renderDetail(MORNING_MEDICATION_KEY, {
      occurrence: {
        title: "T".repeat(120),
        description: `${PROSE.repeat(28).slice(0, 2000)}\n${UNBROKEN_300}`,
        actor: NAME_NO_SPACES,
        assignee: NAME_NO_SPACES,
      },
      documents: documentsNamed(["A.pdf", "B.pdf", "C.pdf", "D.pdf", "E.pdf", "F.pdf"]),
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("[FAM-UI-07] TaskDetailView: Edit event button and Back to the origin (CHG-014)", () => {
  const classesOf = (element: Element) => [...element.classList];

  it("[FAM-UI-07][AC-09] shows one 'Edit event' button in the title row, linking to the event's edit route", async () => {
    await renderDetail();

    const edit = screen.getByRole("link", { name: "Edit event" });
    expect(edit).toHaveAttribute(
      "href",
      "/family/client-margaret/events/event-margaret-morning-meds/edit",
    );
    // One edit control on the page: the old Description 'Edit' link is gone.
    expect(screen.getAllByRole("link", { name: /edit/i })).toHaveLength(1);
    // It sits in the same row as the page title, after it.
    const heading = screen.getByRole("heading", { level: 1, name: "Morning medication" });
    const row = screen.getByTestId("task-detail-title-row");
    expect(row).toContainElement(heading);
    expect(row).toContainElement(edit);
    expect(heading.compareDocumentPosition(edit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("[FAM-UI-07][AC-09] the Edit event button is an outlined kit-style button: 44px target, tokens only, never white text on teal", async () => {
    await renderDetail();

    const edit = screen.getByRole("link", { name: "Edit event" });
    const classes = classesOf(edit);
    expect(classes).toEqual(
      expect.arrayContaining(["h-11", "min-w-11", "border", "border-border-brand", "shrink-0"]),
    );
    expect(classes.some((name) => /^bg-(primary|brand)|text-white|#|\[#/.test(name))).toBe(false);
    // The title row wraps, so the button drops below a long title instead of overlapping it.
    expect(screen.getByTestId("task-detail-title-row")).toHaveClass("flex-wrap");
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("min-w-0");
  });

  it("[FAM-UI-07][AC-09] a 120-character unbroken title and the Edit event button both stay, the title wrapping", async () => {
    await renderDetail(MORNING_MEDICATION_KEY, { occurrence: { title: "T".repeat(120) } });

    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("[overflow-wrap:anywhere]");
    expect(screen.getByRole("link", { name: "Edit event" })).toBeInTheDocument();
  });

  it.each([
    [
      { from: "calendar", view: { view: "week", date: "2026-12-02", month: "2026-12" } },
      "Back to Calendar",
      "/family/client-margaret/calendar?view=week&date=2026-12-02",
    ],
    [{ from: "home" }, "Back to Home", "/family/client-margaret/home"],
    [
      { from: "tasks", view: { q: "meds", status: "done", page: 2 } },
      "Back to Task log",
      "/family/client-margaret/tasks?q=meds&status=done&page=2",
    ],
  ] as [TaskDetailOrigin, string, string][])(
    "[FAM-UI-07][AC-10] opened from %j, Back reads %j and returns to %j",
    async (origin, label, href) => {
      await renderDetail(MORNING_MEDICATION_KEY, { origin });

      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
      expect(screen.getAllByRole("link", { name: /^Back to/ })).toHaveLength(1);
    },
  );

  it("[FAM-UI-07][AC-10] has no axe violations when opened from the Calendar", async () => {
    const { container } = await renderDetail(MORNING_MEDICATION_KEY, {
      origin: { from: "calendar", view: { view: "month", date: "2026-12-01", month: "2026-12" } },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
