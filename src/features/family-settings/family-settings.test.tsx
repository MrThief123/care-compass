import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Loading from "@/app/(family)/family/[clientId]/settings/loading";
import { FamilySettingsView } from "@/features/family-settings/family-settings-view";
import { SettingsErrorState } from "@/features/family-settings/settings-error-state";
import { getClientHeaderSummary, type ClientHeaderSummary } from "@/server/clients/queries";
import { getFamilyContactDetails, type FamilyContactDetails } from "@/server/profiles/queries";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mocks.refresh }),
}));

/*
 * The view is rendered with what the contract returns for the fixtures (Margaret,
 * Banksia Home Care, profile-helen: CHG-023), or with a hand-built object for an
 * edge case (TEST_PLAN "Test levels"). The contract itself is covered in
 * src/server/profiles/queries.test.ts.
 */
const CLIENT_ID = "client-margaret";
const PROFILE_ID = "profile-helen";

const ORGANISATION_TEXT = "Currently registered with Banksia Home Care.";
const NOT_AVAILABLE = "Choosing a new organisation is not available yet.";
const RESET_SENT = "We've emailed you a link to reset your password.";

let header: ClientHeaderSummary;
let contact: FamilyContactDetails;

beforeEach(async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  header = await getClientHeaderSummary(CLIENT_ID);
  contact = await getFamilyContactDetails(PROFILE_ID);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

function renderSettings(
  overrides: { header?: ClientHeaderSummary; contact?: FamilyContactDetails } = {},
) {
  return render(
    <FamilySettingsView
      header={overrides.header ?? header}
      contact={overrides.contact ?? contact}
    />,
  );
}

function input(label: string) {
  return screen.getByRole("textbox", { name: label });
}

/** Everything the screen's live regions say right now. */
function announced() {
  return screen
    .queryAllByRole("status")
    .map((region) => region.textContent ?? "")
    .join(" ")
    .trim();
}

/** Family info is read-only until 'Edit' is clicked (CHG-024). */
async function startEditing(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Edit" }));
}

async function openChangeDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Change" }));
  return screen.getByRole("dialog", { name: "Change organisation?" });
}

describe("[FAM-UI-06] Family Settings", () => {
  it("[FAM-UI-06][AC-01] shows the 'Settings' heading and the Family info inputs, in order, with Helen's details", () => {
    renderSettings();

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Family info" })).toBeInTheDocument();

    expect(screen.getAllByRole("textbox")).toEqual([
      input("Name"),
      input("Phone"),
      input("Email"),
      input("Address"),
    ]);

    expect(input("Name")).toHaveValue("Helen Doyle");
    expect(input("Phone")).toHaveValue("0412 345 678");
    expect(input("Email")).toHaveValue("helen@example.com");
    expect(input("Address")).toHaveValue("12 Wattle St, Preston VIC 3072");
  });

  it("[FAM-UI-06][AC-02] 'Change' opens the destructive 'Change organisation?' dialog with the FAM-13 wording", async () => {
    const user = userEvent.setup();
    renderSettings();

    expect(screen.getByRole("heading", { name: "Change organisation" })).toBeInTheDocument();
    expect(screen.getByText(ORGANISATION_TEXT)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const dialog = await openChangeDialog(user);

    expect(dialog).toHaveTextContent(
      "Switching Margaret's care to a new organisation keeps her routines, events, budget, documents and history. Assigned nurses and all future shifts will be cleared, and Banksia Home Care will lose access immediately. This can't be undone from your side.",
    );
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Change organisation" })).toBeInTheDocument();
  });

  it.each([
    [
      "Cancel",
      (user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) =>
        user.click(within(dialog).getByRole("button", { name: "Cancel" })),
    ],
    [
      "the close X",
      (user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) =>
        user.click(within(dialog).getByRole("button", { name: "Close" })),
    ],
    ["Escape", (user: ReturnType<typeof userEvent.setup>) => user.keyboard("{Escape}")],
  ])(
    "[FAM-UI-06][AC-03] %s closes the dialog, returns focus to 'Change' and says nothing",
    async (_way, close) => {
      const user = userEvent.setup();
      renderSettings();

      const dialog = await openChangeDialog(user);
      await close(user, dialog);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Change" })).toHaveFocus();
      expect(announced()).toBe("");
      expect(screen.getByText(ORGANISATION_TEXT)).toBeInTheDocument();
    },
  );

  it("[FAM-UI-06][AC-04] confirming says choosing an organisation is not available yet, and keeps Banksia Home Care", async () => {
    const user = userEvent.setup();
    renderSettings();

    // The live region is on the page before anything is announced into it (FD-01).
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    const dialog = await openChangeDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Change organisation" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(announced()).toContain(NOT_AVAILABLE);
    expect(screen.getByText(ORGANISATION_TEXT)).toBeInTheDocument();
  });

  it("[FAM-UI-06][AC-05] 'Reset' says a reset link was emailed, without naming any address", async () => {
    const user = userEvent.setup();
    renderSettings();

    expect(screen.getByRole("heading", { name: "Reset username / password" })).toBeInTheDocument();
    expect(
      screen.getByText("We'll email you a secure link to reset your credentials."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(announced()).toContain(RESET_SENT);
    expect(announced()).not.toContain("@");
    // No confirmation step (FD-02).
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("[FAM-UI-06][AC-06] Save keeps an edited phone number and says 'Saved.'; rendering again shows the fixture value", async () => {
    const user = userEvent.setup();
    const first = renderSettings();

    await startEditing(user);
    await user.clear(input("Phone"));
    await user.type(input("Phone"), "0400 000 000");
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Save is asynchronous since FAM-12 (it awaits the Server Action), so wait for it.
    await screen.findByText("Saved.");
    expect(input("Phone")).toHaveValue("0400 000 000");
    expect(announced()).toContain("Saved.");

    first.unmount();
    renderSettings();

    expect(input("Phone")).toHaveValue("0412 345 678");
  });

  it("[FAM-UI-06][AC-06] Save trims stray space from the saved values", async () => {
    const user = userEvent.setup();
    renderSettings();

    await startEditing(user);
    await user.clear(input("Address"));
    await user.type(input("Address"), "  1 Oak Rd  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(input("Address")).toHaveValue("1 Oak Rd");
  });

  it("[FAM-UI-06][AC-07] Save with a blank name, a bad email and a bad phone shows each message on its input and saves nothing", async () => {
    const user = userEvent.setup();
    renderSettings();

    await startEditing(user);
    await user.clear(input("Name"));
    await user.clear(input("Email"));
    await user.type(input("Email"), "helen@");
    await user.clear(input("Phone"));
    await user.type(input("Phone"), "abc");
    await user.click(screen.getByRole("button", { name: "Save" }));

    const expected: Array<[string, string]> = [
      ["Name", "Enter your name."],
      ["Email", "Enter an email address like name@example.com."],
      ["Phone", "Enter a phone number like 0412 345 678."],
    ];
    for (const [label, message] of expected) {
      const field = input(label);
      expect(field).toHaveAttribute("aria-invalid", "true");
      expect(field).toHaveAccessibleDescription(message);
    }
    expect(input("Name")).toHaveFocus();
    expect(announced()).not.toContain("Saved.");

    await user.type(input("Name"), "Helen Doyle");
    await user.clear(input("Email"));
    await user.type(input("Email"), "helen@example.com");
    await user.clear(input("Phone"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    for (const [label, message] of expected) {
      expect(input(label)).not.toHaveAttribute("aria-invalid");
      expect(screen.queryByText(message)).not.toBeInTheDocument();
    }
    expect(announced()).toContain("Saved.");
  });

  it("[FAM-UI-06][AC-07] editing a field clears that field's error, and 'Edit' clears the 'Saved.' message", async () => {
    const user = userEvent.setup();
    renderSettings();

    await startEditing(user);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(announced()).toContain("Saved.");
    await startEditing(user);
    expect(announced()).not.toContain("Saved.");

    await user.clear(input("Name"));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Enter your name.")).toBeInTheDocument();
    await user.type(input("Name"), "H");
    expect(screen.queryByText("Enter your name.")).not.toBeInTheDocument();
  });
});

describe("[FAM-UI-06] read-only until Edit (CHG-024)", () => {
  it("[FAM-UI-06][AC-10] Family info starts read-only with an 'Edit' button and no 'Save'", async () => {
    const user = userEvent.setup();
    renderSettings();

    for (const label of ["Name", "Phone", "Email", "Address"]) {
      expect(input(label)).toHaveAttribute("readonly");
    }
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();

    await user.type(input("Name"), "X");
    expect(input("Name")).toHaveValue("Helen Doyle");
  });

  it("[FAM-UI-06][AC-10] 'Edit' opens the fields, focuses Name and becomes 'Save'; a valid Save locks them again", async () => {
    const user = userEvent.setup();
    renderSettings();

    await startEditing(user);

    for (const label of ["Name", "Phone", "Email", "Address"]) {
      expect(input(label)).not.toHaveAttribute("readonly");
    }
    expect(input("Name")).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();

    await user.clear(input("Phone"));
    await user.type(input("Phone"), "0400 000 000");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(input("Phone")).toHaveValue("0400 000 000");
    expect(input("Phone")).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Edit" })).toHaveFocus();
    expect(announced()).toContain("Saved.");
  });

  it("[FAM-UI-06][AC-10] an invalid Save stays in edit mode", async () => {
    const user = userEvent.setup();
    renderSettings();

    await startEditing(user);
    await user.clear(input("Name"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(input("Name")).not.toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("[FAM-UI-06][AC-11] 'Cancel' shows only in edit mode, next to 'Save'", async () => {
    const user = userEvent.setup();
    renderSettings();

    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    await startEditing(user);

    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(cancel.parentElement).toContainElement(screen.getByRole("button", { name: "Save" }));
  });

  it("[FAM-UI-06][AC-11] 'Cancel' reverts every change and errors, locks the inputs and says nothing", async () => {
    const user = userEvent.setup();
    renderSettings();

    await startEditing(user);
    await user.clear(input("Name"));
    await user.clear(input("Phone"));
    await user.type(input("Phone"), "abc");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Enter your name.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(input("Name")).toHaveValue("Helen Doyle");
    expect(input("Phone")).toHaveValue("0412 345 678");
    for (const label of ["Name", "Phone", "Email", "Address"]) {
      expect(input(label)).toHaveAttribute("readonly");
      expect(input(label)).not.toHaveAttribute("aria-invalid");
    }
    expect(screen.queryByText("Enter your name.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toHaveFocus();
    expect(announced()).toBe("");
  });

  it("[FAM-UI-06][AC-11] 'Cancel' goes back to the last saved values, not the fixture", async () => {
    const user = userEvent.setup();
    renderSettings();

    await startEditing(user);
    await user.clear(input("Phone"));
    await user.type(input("Phone"), "0400 000 000");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await startEditing(user);
    await user.clear(input("Phone"));
    await user.type(input("Phone"), "0499 999 999");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(input("Phone")).toHaveValue("0400 000 000");
  });
});

describe("[FAM-UI-06] states (States sheet, FD-05)", () => {
  it("[FAM-UI-06][AC-08] a profile with no phone or address shows those inputs empty, and the card still shows", () => {
    renderSettings({ contact: { profileId: "profile-michael", name: "Michael Hale" } });

    expect(screen.getByRole("heading", { name: "Family info" })).toBeInTheDocument();
    expect(input("Name")).toHaveValue("Michael Hale");
    expect(input("Phone")).toHaveValue("");
    expect(input("Email")).toHaveValue("");
    expect(input("Address")).toHaveValue("");
  });

  it("[FAM-UI-06][AC-08] a client with no organisation reads 'Not registered with an organisation.' and has no 'Change'", () => {
    renderSettings({ header: { ...header, organisationName: undefined } });

    expect(screen.getByText("Not registered with an organisation.")).toBeInTheDocument();
    expect(screen.queryByText(ORGANISATION_TEXT)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change" })).not.toBeInTheDocument();
  });

  it("[FAM-UI-06][AC-08] the error state shows 'Something went wrong' with Retry, which refreshes the route", async () => {
    const user = userEvent.setup();
    render(<SettingsErrorState />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("[FAM-UI-06][AC-08] loading state: one labelled status, with no data in it", () => {
    render(<Loading />);

    expect(screen.getAllByRole("status", { name: "Loading" })).toHaveLength(1);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});

describe("[FAM-UI-06] accessibility and long content (FD-06)", () => {
  it("[FAM-UI-06][AC-09] the screen, with the dialog open, and in edit mode, has no axe violations", async () => {
    const user = userEvent.setup();
    const { container } = renderSettings();
    expect(await axe(container)).toHaveNoViolations();

    await openChangeDialog(user);
    expect(await axe(container)).toHaveNoViolations();
    await user.keyboard("{Escape}");

    await startEditing(user);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[FAM-UI-06][AC-09] the error, loading and no-organisation states have no axe violations", async () => {
    const error = render(<SettingsErrorState />);
    expect(await axe(error.container)).toHaveNoViolations();
    error.unmount();

    const loading = render(<Loading />);
    expect(await axe(loading.container)).toHaveNoViolations();
    loading.unmount();

    const noOrganisation = renderSettings({ header: { ...header, organisationName: undefined } });
    expect(await axe(noOrganisation.container)).toHaveNoViolations();
  });

  it("[FAM-UI-06][AC-09] a 200-character name and address are held in full by their inputs", () => {
    const longName = "N".repeat(200);
    const longAddress = "A".repeat(200);
    renderSettings({ contact: { ...contact, name: longName, address: longAddress } });

    expect(input("Name")).toHaveValue(longName);
    expect(input("Address")).toHaveValue(longAddress);
    // Layout at 1920 to 768 wide is checked in the real-browser sweep (FD-06).
  });
});
