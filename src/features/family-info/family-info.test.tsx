import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Loading from "@/app/(family)/family/[clientId]/info/loading";
import FamilyInfoPage from "@/app/(family)/family/[clientId]/info/page";
import type { ClientInfoSection, DocumentRef } from "@/types/domain";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  getClientHeaderSummary: vi.fn(),
  getClientInfoSections: vi.fn(),
  getClientDocuments: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mocks.refresh }),
}));
vi.mock("@/server/clients/queries", () => ({
  getClientHeaderSummary: mocks.getClientHeaderSummary,
  getClientInfoSections: mocks.getClientInfoSections,
}));
vi.mock("@/server/documents/queries", () => ({
  getClientDocuments: mocks.getClientDocuments,
}));

/*
 * The screen reads only through the `src/server/**` contract, so these tests
 * replace that contract with data that mirrors docs/design/screens/family-04-info.png
 * (TEST_PLAN "Test data": a test may create its own fixtures). The contract's own
 * fixtures are covered in src/server/clients/queries.test.ts.
 */
const CLIENT_ID = "client-margaret";

const DESCRIPTION =
  "Margaret lives independently with regular support from Banksia Home Care. She uses a walking frame for mobility outside the home and prefers morning appointments.";
const HABITS =
  "Enjoys gardening and radio in the afternoon. Prefers tea over coffee. Sleeps 9pm–7am — morning routine should not be rushed.";
const MEDICAL_HISTORY =
  "Type 2 diabetes (diagnosed 2019), mild osteoarthritis. Known allergy: penicillin. See attached care plan for full medication schedule.";

function section(
  kind: ClientInfoSection["kind"],
  title: string,
  content: string,
): ClientInfoSection {
  return {
    id: `info-${kind}`,
    clientId: CLIENT_ID,
    kind,
    title,
    content,
    updatedAt: "2026-09-01T10:00:00+10:00",
  };
}

const SECTIONS = [
  section("description", "Description", DESCRIPTION),
  section("habits", "Habits", HABITS),
  section("medicalHistory", "Medical history", MEDICAL_HISTORY),
];

function file(id: string, name: string, uploadedAt: string): DocumentRef {
  return {
    id,
    clientId: CLIENT_ID,
    name,
    url: `/files/${id}`,
    uploadedAt,
    uploadedBy: "Helen Doyle",
  };
}

const DOCUMENTS = [
  file("doc-care-plan", "Care plan.pdf", "2026-08-01T09:00:00+10:00"),
  file("doc-medication", "Medication schedule.pdf", "2026-08-02T09:00:00+10:00"),
];

beforeEach(() => {
  mocks.getClientHeaderSummary.mockResolvedValue({
    id: CLIENT_ID,
    firstName: "Margaret",
    lastName: "Doyle",
    age: 78,
    suburb: "Preston VIC",
    organisationName: "Banksia Home Care",
  });
  mocks.getClientInfoSections.mockResolvedValue(SECTIONS);
  mocks.getClientDocuments.mockResolvedValue(DOCUMENTS);
});

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

/** The page logs a tagged line when the contract rejects; keep it out of the test output. */
function captureErrorLog() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

async function renderInfo() {
  const page = await FamilyInfoPage({ params: Promise.resolve({ clientId: CLIENT_ID }) });
  return render(page);
}

function card(name: string) {
  return screen.getByRole("region", { name });
}

describe("[FAM-UI-04] Family Info", () => {
  it("[FAM-UI-04][AC-01] shows the Description, Habits, Medical history and Documentation cards, in that order, with the design text", async () => {
    await renderInfo();

    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(["Description", "Habits", "Medical history", "Documentation"]);

    // Each card is a labelled region, so the four are exactly what a screen reader lists.
    expect(screen.getAllByRole("region")).toHaveLength(4);

    expect(within(card("Description")).getByText(DESCRIPTION)).toBeInTheDocument();
    expect(within(card("Habits")).getByText(HABITS)).toBeInTheDocument();
    expect(within(card("Medical history")).getByText(MEDICAL_HISTORY)).toBeInTheDocument();
  });

  it("[FAM-UI-04][PRD] does not repeat the client's name and summary line, which the shell header already shows", async () => {
    await renderInfo();

    // FD-08: the design draws the block twice; the human asked for one copy, the shell's.
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Margaret" })).not.toBeInTheDocument();
    expect(
      screen.queryByText("78 years · Preston VIC · Banksia Home Care"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("M")).not.toBeInTheDocument();
  });

  it("[FAM-UI-04][AC-01] each of the three text cards has an Edit button named for its section", async () => {
    await renderInfo();

    for (const title of ["Description", "Habits", "Medical history"]) {
      const edit = within(card(title)).getByRole("button", { name: `Edit ${title}` });
      expect(edit).toHaveTextContent("Edit");
    }
    // Documentation has no Edit: files are added through 'Add file'.
    expect(
      within(card("Documentation")).queryByRole("button", { name: /^Edit/ }),
    ).not.toBeInTheDocument();
  });

  it("[FAM-UI-04][AC-02] Edit on Habits shows a textarea holding the current text, with Save and Cancel", async () => {
    const user = userEvent.setup();
    await renderInfo();
    const habits = card("Habits");

    await user.click(within(habits).getByRole("button", { name: "Edit Habits" }));

    const textarea = within(habits).getByRole("textbox", { name: /habits/i });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveValue(HABITS);
    expect(within(habits).getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(within(habits).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("[FAM-UI-04][AC-03] Documentation shows the tiles 'Care plan.pdf', 'Medication schedule.pdf' and 'Add file', in that order", async () => {
    await renderInfo();
    const documentation = card("Documentation");

    const tiles = within(documentation)
      .getAllByRole("listitem")
      .map((item) => item.textContent?.trim());
    expect(tiles).toEqual(["Care plan.pdf", "Medication schedule.pdf", "Add file"]);
    expect(within(documentation).getByRole("button", { name: "Add file" })).toBeInTheDocument();
  });

  it("[FAM-UI-04][AC-03] a document tile carries its name only, with no size or type line", async () => {
    await renderInfo();
    const documentation = card("Documentation");

    expect(within(documentation).queryByText(/KB|MB|PDF ·/)).not.toBeInTheDocument();
  });
});

describe("[FAM-UI-04] inline edit (PROPOSED interaction, PRD Scope)", () => {
  it("[FAM-UI-04][PRD] moves focus into the textarea when Edit is pressed", async () => {
    const user = userEvent.setup();
    await renderInfo();

    await user.click(within(card("Habits")).getByRole("button", { name: "Edit Habits" }));

    expect(within(card("Habits")).getByRole("textbox")).toHaveFocus();
  });

  it("[FAM-UI-04][PRD] Save shows the edited text in place of the textarea, and focus returns to Edit", async () => {
    const user = userEvent.setup();
    await renderInfo();
    const habits = card("Habits");

    await user.click(within(habits).getByRole("button", { name: "Edit Habits" }));
    const textarea = within(habits).getByRole("textbox");
    await user.clear(textarea);
    await user.type(textarea, "Likes a nap after lunch.");
    await user.click(within(habits).getByRole("button", { name: "Save" }));

    expect(within(habits).queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(habits).getByText("Likes a nap after lunch.")).toBeInTheDocument();
    expect(within(habits).queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(within(habits).getByRole("button", { name: "Edit Habits" })).toHaveFocus();
  });

  it("[FAM-UI-04][PRD] Cancel puts the original text back and drops what was typed, and focus returns to Edit", async () => {
    const user = userEvent.setup();
    await renderInfo();
    const habits = card("Habits");

    await user.click(within(habits).getByRole("button", { name: "Edit Habits" }));
    await user.type(within(habits).getByRole("textbox"), " Something else.");
    await user.click(within(habits).getByRole("button", { name: "Cancel" }));

    expect(within(habits).queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(habits).getByText(HABITS)).toBeInTheDocument();
    expect(within(habits).getByRole("button", { name: "Edit Habits" })).toHaveFocus();

    // Editing again starts from the saved text, not the cancelled draft.
    await user.click(within(habits).getByRole("button", { name: "Edit Habits" }));
    expect(within(habits).getByRole("textbox")).toHaveValue(HABITS);
  });

  it("[FAM-UI-04][PRD] each card edits on its own: opening one leaves the others' text and their Edit buttons alone", async () => {
    const user = userEvent.setup();
    await renderInfo();

    await user.click(within(card("Habits")).getByRole("button", { name: "Edit Habits" }));
    await user.type(within(card("Habits")).getByRole("textbox"), " Unsaved draft.");
    await user.click(
      within(card("Medical history")).getByRole("button", { name: "Edit Medical history" }),
    );

    // The Habits draft was not thrown away by opening another card.
    expect(within(card("Habits")).getByRole("textbox")).toHaveValue(`${HABITS} Unsaved draft.`);
    expect(within(card("Medical history")).getByRole("textbox")).toHaveValue(MEDICAL_HISTORY);
    // The Description card is untouched.
    expect(within(card("Description")).getByText(DESCRIPTION)).toBeInTheDocument();
    expect(within(card("Description")).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("[FAM-UI-04][PRD] while a card is being edited its Edit button is not offered a second time", async () => {
    const user = userEvent.setup();
    await renderInfo();
    const habits = card("Habits");

    await user.click(within(habits).getByRole("button", { name: "Edit Habits" }));

    expect(within(habits).queryByRole("button", { name: "Edit Habits" })).not.toBeInTheDocument();
  });

  it("[FAM-UI-04][PRD] saving a blank textarea shows 'Nothing added yet.' rather than an empty card", async () => {
    const user = userEvent.setup();
    await renderInfo();
    const habits = card("Habits");

    await user.click(within(habits).getByRole("button", { name: "Edit Habits" }));
    await user.clear(within(habits).getByRole("textbox"));
    await user.type(within(habits).getByRole("textbox"), "   ");
    await user.click(within(habits).getByRole("button", { name: "Save" }));

    expect(within(habits).getByText("Nothing added yet.")).toBeInTheDocument();
    // The heading and Edit stay, so the text can be added back.
    expect(within(habits).getByRole("button", { name: "Edit Habits" })).toBeInTheDocument();
  });

  it("[FAM-UI-04][PRD] Save keeps the words but trims stray space at either end", async () => {
    const user = userEvent.setup();
    await renderInfo();
    const habits = card("Habits");

    await user.click(within(habits).getByRole("button", { name: "Edit Habits" }));
    await user.clear(within(habits).getByRole("textbox"));
    await user.type(within(habits).getByRole("textbox"), "  Tea at four.  ");
    await user.click(within(habits).getByRole("button", { name: "Save" }));
    await user.click(within(habits).getByRole("button", { name: "Edit Habits" }));

    expect(within(habits).getByRole("textbox")).toHaveValue("Tea at four.");
  });

  it("[FAM-UI-04][PRD] an edit lives in local state only: rendering the screen again shows the fixture text", async () => {
    const user = userEvent.setup();
    const first = await renderInfo();
    const habits = card("Habits");

    await user.click(within(habits).getByRole("button", { name: "Edit Habits" }));
    await user.clear(within(habits).getByRole("textbox"));
    await user.type(within(habits).getByRole("textbox"), "Changed.");
    await user.click(within(habits).getByRole("button", { name: "Save" }));
    first.unmount();

    await renderInfo();

    expect(within(card("Habits")).getByText(HABITS)).toBeInTheDocument();
    expect(mocks.getClientInfoSections).toHaveBeenCalledTimes(2);
  });

  it("[FAM-UI-04][PRD] Tab from the textarea reaches Save, then Cancel", async () => {
    const user = userEvent.setup();
    await renderInfo();
    const habits = card("Habits");

    await user.click(within(habits).getByRole("button", { name: "Edit Habits" }));
    await user.tab();
    expect(within(habits).getByRole("button", { name: "Save" })).toHaveFocus();
    await user.tab();
    expect(within(habits).getByRole("button", { name: "Cancel" })).toHaveFocus();
  });
});

describe("[FAM-UI-04] Add file (Phase 1: uploads are FAM-08)", () => {
  it("[FAM-UI-04][PRD] pressing 'Add file' says adding files is not available yet, and adds nothing", async () => {
    const user = userEvent.setup();
    await renderInfo();
    const documentation = card("Documentation");

    await user.click(within(documentation).getByRole("button", { name: "Add file" }));

    expect(within(documentation).getByRole("status")).toHaveTextContent(
      "Adding files is not available yet.",
    );
    expect(within(documentation).getAllByRole("listitem")).toHaveLength(3);
  });
});

describe("[FAM-UI-04] states (States sheet)", () => {
  it("[FAM-UI-04][PRD] a client with documents but no text sections still shows the Documentation card", async () => {
    mocks.getClientInfoSections.mockResolvedValue([]);
    await renderInfo();

    expect(screen.queryByRole("region", { name: "Description" })).not.toBeInTheDocument();
    expect(within(card("Documentation")).getByText("Care plan.pdf")).toBeInTheDocument();
  });

  it("[FAM-UI-04][PRD] a Documentation card with no files shows 'Add file' alone", async () => {
    mocks.getClientDocuments.mockResolvedValue([]);
    await renderInfo();
    const documentation = card("Documentation");

    expect(within(documentation).getAllByRole("listitem")).toHaveLength(1);
    expect(within(documentation).getByRole("button", { name: "Add file" })).toBeInTheDocument();
  });

  it("[FAM-UI-04][PRD] empty state: no sections and no documents shows one message, with no Edit and no Add file", async () => {
    mocks.getClientInfoSections.mockResolvedValue([]);
    mocks.getClientDocuments.mockResolvedValue([]);
    await renderInfo();

    expect(screen.getByText("No information yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Edit|Add file/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it.each([
    ["getClientInfoSections", () => mocks.getClientInfoSections.mockRejectedValue(new Error("x"))],
    ["getClientDocuments", () => mocks.getClientDocuments.mockRejectedValue(new Error("x"))],
  ])(
    "[FAM-UI-04][PRD] error state: shows 'Something went wrong' with Retry when %s rejects",
    async (_contractFunction, rejectIt) => {
      captureErrorLog();
      rejectIt();
      const user = userEvent.setup();
      await renderInfo();

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      // Nothing half-loaded is left on screen beside the error.
      expect(screen.queryByRole("region")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Retry" }));
      expect(mocks.refresh).toHaveBeenCalledTimes(1);
    },
  );

  it("[FAM-UI-04][PRD] logs a feature-tagged line, without the error's message, when the contract rejects", async () => {
    // ARCHITECTURE.md §12.5: no PII or medical text in logs.
    const log = captureErrorLog();
    mocks.getClientInfoSections.mockRejectedValue(new Error("no habits row for Margaret Doyle"));
    await renderInfo();

    expect(log).toHaveBeenCalledTimes(1);
    const logged = log.mock.calls[0]!.join(" ");
    expect(logged).toContain("[family-info]");
    expect(logged).not.toContain("Margaret");
    expect(logged).not.toContain("habits row");
  });

  it("[FAM-UI-04][PRD] loading state: a labelled skeleton of the four cards, with no data in it", () => {
    render(<Loading />);

    expect(screen.getAllByRole("status", { name: "Loading" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByText(DESCRIPTION)).not.toBeInTheDocument();
  });
});

describe("[FAM-UI-04] the screen reads through the contract", () => {
  it("[FAM-UI-04][PRD] asks the contract for the route's client, and only that client", async () => {
    await renderInfo();

    expect(mocks.getClientInfoSections).toHaveBeenCalledWith(CLIENT_ID);
    expect(mocks.getClientDocuments).toHaveBeenCalledWith(CLIENT_ID);
  });

  it("[FAM-UI-04][PRD] does not read the client's header summary: the shell header owns it", async () => {
    await renderInfo();

    expect(mocks.getClientHeaderSummary).not.toHaveBeenCalled();
  });
});

describe("[FAM-UI-04] long and unusual content wraps inside its card (no overlap at any width)", () => {
  it("[FAM-UI-04][PRD] long unbroken text and non-ASCII text can wrap anywhere, and keep their line breaks", async () => {
    const unbroken = "Z".repeat(300);
    mocks.getClientInfoSections.mockResolvedValue([
      section("description", "Description", unbroken),
      section("habits", "Habits", "First line.\nSecond line — 朝の薬 💊"),
      section("medicalHistory", "Medical history", MEDICAL_HISTORY),
    ]);
    await renderInfo();

    const long = within(card("Description")).getByText(unbroken);
    expect(long.className).toContain("[overflow-wrap:anywhere]");

    const habits = within(card("Habits")).getByText(/First line\./);
    expect(habits.className).toContain("whitespace-pre-line");
    expect(habits).toHaveTextContent("Second line — 朝の薬 💊");
  });

  it("[FAM-UI-04][PRD] a long file name is cut to two lines with the whole name in its title", async () => {
    const longName = `${"Medication schedule and administration record ".repeat(6)}final.pdf`;
    mocks.getClientDocuments.mockResolvedValue([
      file("doc-long", longName, "2026-08-01T09:00:00+10:00"),
    ]);
    await renderInfo();

    const name = within(card("Documentation")).getByText(longName);
    expect(name).toHaveAttribute("title", longName);
    expect(name.className).toContain("line-clamp-2");
  });

  it("[FAM-UI-04][PRD] the tiles wrap to another row rather than overflow when there are many files", async () => {
    mocks.getClientDocuments.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) =>
        file(
          `doc-${i}`,
          `Document ${i + 1}.pdf`,
          `2026-08-${String(i + 1).padStart(2, "0")}T09:00:00+10:00`,
        ),
      ),
    );
    await renderInfo();

    const list = within(card("Documentation")).getByRole("list");
    expect(list.className).toContain("flex-wrap");
    expect(within(list).getAllByRole("listitem")).toHaveLength(13);
  });
});

describe("[FAM-UI-04] accessibility", () => {
  it("[FAM-UI-04][PRD] the screen, while editing, has no axe violations", async () => {
    const user = userEvent.setup();
    const { container } = await renderInfo();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(within(card("Habits")).getByRole("button", { name: "Edit Habits" }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[FAM-UI-04][PRD] the loading, empty and error states have no axe violations", async () => {
    const loading = render(<Loading />);
    expect(await axe(loading.container)).toHaveNoViolations();
    loading.unmount();

    mocks.getClientInfoSections.mockResolvedValue([]);
    mocks.getClientDocuments.mockResolvedValue([]);
    const empty = await renderInfo();
    expect(await axe(empty.container)).toHaveNoViolations();
    empty.unmount();

    captureErrorLog();
    mocks.getClientDocuments.mockRejectedValue(new Error("x"));
    const error = await renderInfo();
    expect(await axe(error.container)).toHaveNoViolations();
  });
});
