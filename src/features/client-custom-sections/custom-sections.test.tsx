import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CustomSections } from "@/features/client-custom-sections/custom-sections";
import type { ClientCustomSection } from "@/types/domain";

/*
 * F0-26 — the custom-section list shared by Family, Admin and Carer Client Details. It saves
 * only through the contract (`src/server/clients/custom-section-actions`), stubbed here; the
 * actions themselves are in src/server/clients/custom-section-actions.test.ts.
 */
const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  addClientCustomSection: vi.fn(),
  updateClientCustomSection: vi.fn(),
  removeClientCustomSection: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mocks.refresh }),
}));
vi.mock("@/server/clients/custom-section-actions", () => ({
  addClientCustomSection: mocks.addClientCustomSection,
  updateClientCustomSection: mocks.updateClientCustomSection,
  removeClientCustomSection: mocks.removeClientCustomSection,
}));

const CLIENT_ID = "client-robert";
const SHIFT_ENDED = "Your shift has ended, so changes can't be saved.";
const TAKEN = "There's already a section with that title. Choose another.";

function custom(id: string, title: string, content: string): ClientCustomSection {
  return { id, clientId: CLIENT_ID, title, content, updatedAt: "2026-10-01T10:00:00+11:00" };
}

const COMMUNICATION = custom("cs-1", "Communication", "Uses short sentences.");
const BEHAVIOURS = custom("cs-2", "Behaviours of concern", "");

function renderSections(sections: ClientCustomSection[], canEdit = true) {
  return render(<CustomSections clientId={CLIENT_ID} sections={sections} canEdit={canEdit} />);
}

function card(name: string) {
  return screen.getByRole("region", { name });
}

beforeEach(() => {
  mocks.addClientCustomSection.mockResolvedValue({ ok: true, data: { id: "cs-new" } });
  mocks.updateClientCustomSection.mockResolvedValue({ ok: true, data: undefined });
  mocks.removeClientCustomSection.mockResolvedValue({ ok: true, data: undefined });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("[F0-26][AC-01] list", () => {
  it("[F0-26][AC-01] shows each section as a labelled card in the order given, with its text", () => {
    renderSections([COMMUNICATION, BEHAVIOURS]);

    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(["Communication", "Behaviours of concern"]);
    expect(within(card("Communication")).getByText("Uses short sentences.")).toBeInTheDocument();
  });

  it("[F0-26][AC-01] a section with no text reads 'Nothing added yet.'", () => {
    renderSections([BEHAVIOURS]);

    expect(
      within(card("Behaviours of concern")).getByText("Nothing added yet."),
    ).toBeInTheDocument();
  });
});

describe("[F0-26][AC-02] add", () => {
  it("[F0-26][AC-02] Add section opens a form; Save adds the section last and moves focus to its heading", async () => {
    const user = userEvent.setup();
    renderSections([COMMUNICATION]);

    await user.click(screen.getByRole("button", { name: "Add section" }));
    const form = screen.getByRole("form", { name: "New section" });
    expect(within(form).getByLabelText("Title")).toHaveFocus();
    await user.type(within(form).getByLabelText("Title"), "  Sleep ");
    await user.type(within(form).getByLabelText("Text"), "Wakes at 5am.");
    await user.click(within(form).getByRole("button", { name: "Save" }));

    expect(mocks.addClientCustomSection).toHaveBeenCalledWith(
      CLIENT_ID,
      "  Sleep ",
      "Wakes at 5am.",
    );
    const heading = await screen.findByRole("heading", { level: 2, name: "Sleep" });
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "Communication",
      "Sleep",
    ]);
    expect(within(card("Sleep")).getByText("Wakes at 5am.")).toBeInTheDocument();
    expect(heading).toHaveFocus();
    expect(screen.queryByRole("form", { name: "New section" })).not.toBeInTheDocument();
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("[F0-26][AC-02] Cancel closes the form, saves nothing and returns focus to Add section", async () => {
    const user = userEvent.setup();
    renderSections([]);

    await user.click(screen.getByRole("button", { name: "Add section" }));
    await user.type(screen.getByLabelText("Title"), "Sleep");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mocks.addClientCustomSection).not.toHaveBeenCalled();
    expect(screen.queryByRole("form", { name: "New section" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add section" })).toHaveFocus();
  });
});

describe("[F0-26][AC-03] validation", () => {
  it("[F0-26][AC-03] a title refusal shows under the title, and the draft is kept", async () => {
    mocks.addClientCustomSection.mockResolvedValue({
      ok: false,
      error: { code: "VALIDATION", field: "title", message: TAKEN },
    });
    const user = userEvent.setup();
    renderSections([COMMUNICATION]);

    await user.click(screen.getByRole("button", { name: "Add section" }));
    await user.type(screen.getByLabelText("Title"), "communication");
    await user.type(screen.getByLabelText("Text"), "Draft text");
    await user.click(screen.getByRole("button", { name: "Save" }));

    const title = screen.getByLabelText("Title");
    await waitFor(() => expect(title).toHaveAccessibleDescription(TAKEN));
    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(title).toHaveValue("communication");
    expect(screen.getByLabelText("Text")).toHaveValue("Draft text");
  });

  it("[F0-26][AC-03] a text refusal shows under the text box", async () => {
    mocks.addClientCustomSection.mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION",
        field: "content",
        message: "Keep it to 5,000 characters or fewer.",
      },
    });
    const user = userEvent.setup();
    renderSections([]);

    await user.click(screen.getByRole("button", { name: "Add section" }));
    await user.type(screen.getByLabelText("Title"), "Notes");
    await user.type(screen.getByLabelText("Text"), "Too long");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Text")).toHaveAccessibleDescription(
        "Keep it to 5,000 characters or fewer.",
      ),
    );
  });
});

describe("[F0-26][AC-04][AC-05] edit and rename", () => {
  it("[F0-26][AC-05] Edit shows the title and text; Save renames and updates the card", async () => {
    const user = userEvent.setup();
    renderSections([COMMUNICATION]);

    await user.click(screen.getByRole("button", { name: "Edit Communication" }));
    const title = screen.getByLabelText("Title");
    const text = screen.getByLabelText("Text");
    expect(title).toHaveValue("Communication");
    expect(text).toHaveValue("Uses short sentences.");
    await user.clear(title);
    await user.type(title, "Talking with Robert");
    await user.clear(text);
    await user.type(text, "Uses pictures.");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mocks.updateClientCustomSection).toHaveBeenCalledWith(
      CLIENT_ID,
      "cs-1",
      "Talking with Robert",
      "Uses pictures.",
    );
    const renamed = await screen.findByRole("region", { name: "Talking with Robert" });
    expect(within(renamed).getByText("Uses pictures.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Talking with Robert" })).toHaveFocus();
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("[F0-26][AC-04] Cancel restores the saved title and text", async () => {
    const user = userEvent.setup();
    renderSections([COMMUNICATION]);

    await user.click(screen.getByRole("button", { name: "Edit Communication" }));
    await user.type(screen.getByLabelText("Text"), " Changed");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mocks.updateClientCustomSection).not.toHaveBeenCalled();
    expect(within(card("Communication")).getByText("Uses short sentences.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Communication" })).toHaveFocus();
  });
});

describe("[F0-26][AC-06] remove", () => {
  it("[F0-26][AC-06] Remove section asks first; Keep leaves the section as it was", async () => {
    const user = userEvent.setup();
    renderSections([COMMUNICATION]);

    await user.click(screen.getByRole("button", { name: "Remove Communication" }));
    const section = card("Communication");
    expect(
      within(section).getByText("Remove Communication? Its text will be lost."),
    ).toBeInTheDocument();
    await user.click(within(section).getByRole("button", { name: "Keep" }));

    expect(mocks.removeClientCustomSection).not.toHaveBeenCalled();
    expect(within(card("Communication")).getByText("Uses short sentences.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Communication" })).toHaveFocus();
  });

  it("[F0-26][AC-06] Remove deletes it through the contract and moves focus to Add section", async () => {
    const user = userEvent.setup();
    renderSections([COMMUNICATION, BEHAVIOURS]);

    await user.click(screen.getByRole("button", { name: "Remove Communication" }));
    await user.click(within(card("Communication")).getByRole("button", { name: "Remove" }));

    expect(mocks.removeClientCustomSection).toHaveBeenCalledWith(CLIENT_ID, "cs-1");
    await waitFor(() =>
      expect(screen.queryByRole("region", { name: "Communication" })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("region", { name: "Behaviours of concern" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add section" })).toHaveFocus();
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("[F0-26][AC-14] a refused removal shows the message in the card and keeps the section", async () => {
    mocks.removeClientCustomSection.mockResolvedValue({
      ok: false,
      error: { code: "NOT_ALLOWED", message: SHIFT_ENDED },
    });
    const user = userEvent.setup();
    renderSections([COMMUNICATION]);

    await user.click(screen.getByRole("button", { name: "Remove Communication" }));
    await user.click(within(card("Communication")).getByRole("button", { name: "Remove" }));

    expect(await within(card("Communication")).findByText(SHIFT_ENDED)).toBeInTheDocument();
  });
});

describe("[F0-26][AC-08] limit", () => {
  it("[F0-26][AC-08] at 20 sections Add section is replaced by the limit note", () => {
    const twenty = Array.from({ length: 20 }, (_, i) => custom(`cs-${i}`, `Section ${i + 1}`, "x"));
    renderSections(twenty);

    expect(screen.queryByRole("button", { name: "Add section" })).not.toBeInTheDocument();
    expect(
      screen.getByText("This client already has 20 sections. Remove one to add another."),
    ).toBeInTheDocument();
  });

  it("[F0-26][AC-08] at 19 sections Add section is offered", () => {
    const nineteen = Array.from({ length: 19 }, (_, i) =>
      custom(`cs-${i}`, `Section ${i + 1}`, "x"),
    );
    renderSections(nineteen);

    expect(screen.getByRole("button", { name: "Add section" })).toBeInTheDocument();
  });
});

describe("[F0-26][AC-12] read only", () => {
  it("[F0-26][AC-12] without edit rights: sections with text show, empty ones are hidden, no controls", () => {
    renderSections([COMMUNICATION, BEHAVIOURS], false);

    expect(screen.getByRole("region", { name: "Communication" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Behaviours of concern" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("[F0-26][AC-12] without edit rights and nothing written, nothing renders", () => {
    const { container } = renderSections([BEHAVIOURS], false);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("[F0-26][AC-14] refusals while editing", () => {
  it("[F0-26][AC-14] a shift-ended refusal shows the message and keeps the draft open", async () => {
    mocks.updateClientCustomSection.mockResolvedValue({
      ok: false,
      error: { code: "NOT_ALLOWED", message: SHIFT_ENDED },
    });
    const user = userEvent.setup();
    renderSections([COMMUNICATION]);

    await user.click(screen.getByRole("button", { name: "Edit Communication" }));
    await user.type(screen.getByLabelText("Text"), " More.");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await within(card("Communication")).findByText(SHIFT_ENDED)).toBeInTheDocument();
    expect(screen.getByLabelText("Text")).toHaveValue("Uses short sentences. More.");
  });

  it("[F0-26][AC-14] a section removed by someone else is dropped and the reason announced", async () => {
    mocks.updateClientCustomSection.mockResolvedValue({
      ok: false,
      error: { code: "NOT_FOUND", message: "This section no longer exists." },
    });
    const user = userEvent.setup();
    renderSections([COMMUNICATION, BEHAVIOURS]);

    await user.click(screen.getByRole("button", { name: "Edit Communication" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(screen.queryByRole("region", { name: "Communication" })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("status")).toHaveTextContent("This section no longer exists.");
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("[F0-26][AC-14] a save that throws shows a plain-language message", async () => {
    mocks.addClientCustomSection.mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    renderSections([]);

    await user.click(screen.getByRole("button", { name: "Add section" }));
    await user.type(screen.getByLabelText("Title"), "Sleep");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Couldn't save your changes. Try again.")).toBeInTheDocument();
  });
});

describe("[F0-26][AC-15] accessibility", () => {
  it("[F0-26][AC-15] long titles and text wrap instead of overflowing", () => {
    const long = custom("cs-long", "W".repeat(60), "x".repeat(400));
    renderSections([long]);

    const heading = screen.getByRole("heading", { level: 2, name: "W".repeat(60) });
    expect(heading.className).toContain("[overflow-wrap:anywhere]");
    expect(within(card("W".repeat(60))).getByText("x".repeat(400)).className).toContain(
      "[overflow-wrap:anywhere]",
    );
  });

  it("[F0-26][AC-15] controls are at least 44px tall", () => {
    renderSections([COMMUNICATION]);

    for (const name of ["Edit Communication", "Remove Communication", "Add section"]) {
      expect(screen.getByRole("button", { name }).className).toMatch(/\b(h-11|min-h-11)\b/);
    }
  });

  it("[F0-26][AC-15] has no axe violations, viewing, adding and confirming a removal", async () => {
    const user = userEvent.setup();
    const { container } = renderSections([COMMUNICATION, BEHAVIOURS]);
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("button", { name: "Add section" }));
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("button", { name: "Remove Communication" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
