import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FamilySettingsView } from "@/features/family-settings/family-settings-view";
import { getClientHeaderSummary, type ClientHeaderSummary } from "@/server/clients/queries";
import { getFamilyContactDetails, type FamilyContactDetails } from "@/server/profiles/queries";

/*
 * FAM-13: 'Change' opens an organisation picker, then the destructive
 * confirmation; confirming calls `changeClientOrganisation`. The action is
 * replaced so each test decides what it returns; what it does is covered in
 * src/server/clients/actions.test.ts, the pgTAP file and the integration test.
 */
const mocks = vi.hoisted(() => ({ change: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mocks.refresh }),
}));

vi.mock("@/server/clients/actions", () => ({ changeClientOrganisation: mocks.change }));

vi.mock("@/server/profiles/actions", () => ({
  updateFamilyContactDetails: vi.fn(),
  requestOwnPasswordReset: vi.fn(),
}));

const CLIENT_ID = "client-margaret";
const PROFILE_ID = "profile-helen";

const ORGANISATIONS = [
  { id: "org-banksia", name: "Banksia Home Care", isCurrent: true },
  { id: "org-eucalyptus", name: "Eucalyptus Community Care", isCurrent: false },
  { id: "org-wattle", name: "Wattle Care", isCurrent: false },
];

const BODY =
  "Switching Margaret's care to a new organisation keeps her routines, events, budget, documents and history. " +
  "Assigned nurses and all future shifts will be cleared, and Banksia Home Care will lose access immediately. " +
  "This can't be undone from your side.";

let header: ClientHeaderSummary;
let contact: FamilyContactDetails;

beforeEach(async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  header = await getClientHeaderSummary(CLIENT_ID);
  contact = await getFamilyContactDetails(PROFILE_ID);
  mocks.change.mockResolvedValue({ ok: true, data: undefined });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

function renderSettings(
  organisations = ORGANISATIONS,
  overrides: Partial<ClientHeaderSummary> = {},
) {
  return render(
    <FamilySettingsView
      header={{ ...header, ...overrides }}
      contact={contact}
      organisations={organisations}
    />,
  );
}

const picker = () => screen.getByRole("dialog", { name: "Choose a new organisation" });
const confirmation = () => screen.getByRole("dialog", { name: "Change organisation?" });

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Change" }));
}

async function choose(user: ReturnType<typeof userEvent.setup>, name: RegExp | string) {
  await user.click(within(picker()).getByRole("radio", { name }));
  await user.click(within(picker()).getByRole("button", { name: "Continue" }));
}

describe("[FAM-13][AC-04] picker, then confirmation", () => {
  it("[FAM-13][AC-04] 'Change' opens a picker listing the organisations, with the current one marked and not choosable", async () => {
    const user = userEvent.setup();
    renderSettings();

    await openPicker(user);

    expect(screen.queryByRole("dialog", { name: "Change organisation?" })).not.toBeInTheDocument();
    const radios = within(picker()).getAllByRole("radio");
    expect(radios.map((radio) => radio.getAttribute("value"))).toEqual([
      "org-banksia",
      "org-eucalyptus",
      "org-wattle",
    ]);
    const current = within(picker()).getByRole("radio", { name: /Banksia Home Care/ });
    expect(current).toBeDisabled();
    expect(current).toHaveAccessibleName(/Current/);
    expect(within(picker()).getByRole("radio", { name: /Wattle Care/ })).toBeEnabled();
  });

  it("[FAM-13][AC-04] choosing an organisation and pressing Continue opens the destructive 'Change organisation?' dialog with the retained and cleared wording", async () => {
    const user = userEvent.setup();
    renderSettings();

    await openPicker(user);
    await choose(user, /Wattle Care/);

    expect(
      screen.queryByRole("dialog", { name: "Choose a new organisation" }),
    ).not.toBeInTheDocument();
    expect(
      within(confirmation()).getByRole("heading", { name: "Change organisation?" }),
    ).toBeVisible();
    expect(within(confirmation()).getByText(BODY)).toBeVisible();
    expect(
      within(confirmation()).getByRole("button", { name: "Change organisation" }),
    ).toBeVisible();
    expect(within(confirmation()).getByRole("button", { name: "Cancel" })).toBeVisible();
    expect(within(confirmation()).getByRole("button", { name: "Close" })).toBeVisible();
    expect(mocks.change).not.toHaveBeenCalled();
  });

  it("[FAM-13][AC-04] Continue with nothing chosen says to choose one, and opens no confirmation", async () => {
    const user = userEvent.setup();
    renderSettings();

    await openPicker(user);
    await user.click(within(picker()).getByRole("button", { name: "Continue" }));

    expect(within(picker()).getByText("Choose an organisation to continue.")).toBeVisible();
    expect(screen.queryByRole("dialog", { name: "Change organisation?" })).not.toBeInTheDocument();
  });

  it("[FAM-13][AC-04] with no other organisation to move to there is no Change button, and the card says so", () => {
    renderSettings([ORGANISATIONS[0]!]);

    expect(screen.queryByRole("button", { name: "Change" })).not.toBeInTheDocument();
    expect(screen.getByText("Currently registered with Banksia Home Care.")).toBeVisible();
    expect(screen.getByText(/no other organisation/i)).toBeVisible();
  });
});

describe("[FAM-13][AC-05] cancelling calls nothing", () => {
  it("[FAM-13][AC-05] Cancel on the confirmation does not call the action, and focus returns to Change", async () => {
    const user = userEvent.setup();
    renderSettings();

    await openPicker(user);
    await choose(user, /Wattle Care/);
    await user.click(within(confirmation()).getByRole("button", { name: "Cancel" }));

    expect(mocks.change).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change" })).toHaveFocus();
    expect(screen.getByText("Currently registered with Banksia Home Care.")).toBeVisible();
  });

  it("[FAM-13][AC-05] the X and Escape on the confirmation also call nothing", async () => {
    const user = userEvent.setup();
    renderSettings();

    await openPicker(user);
    await choose(user, /Wattle Care/);
    await user.click(within(confirmation()).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await openPicker(user);
    await choose(user, /Wattle Care/);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.change).not.toHaveBeenCalled();
  });

  it("[FAM-13][AC-05] Cancel and Escape on the picker close it, call nothing, and return focus to Change", async () => {
    const user = userEvent.setup();
    renderSettings();

    await openPicker(user);
    await user.click(within(picker()).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change" })).toHaveFocus();

    await openPicker(user);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change" })).toHaveFocus();
    expect(mocks.change).not.toHaveBeenCalled();
  });

  it("[FAM-13][AC-05] the chosen organisation is forgotten when the picker is reopened", async () => {
    const user = userEvent.setup();
    renderSettings();

    await openPicker(user);
    await user.click(within(picker()).getByRole("radio", { name: /Wattle Care/ }));
    await user.click(within(picker()).getByRole("button", { name: "Cancel" }));
    await openPicker(user);

    expect(within(picker()).getByRole("radio", { name: /Wattle Care/ })).not.toBeChecked();
  });
});

describe("[FAM-13][AC-01] confirming changes the organisation", () => {
  it("[FAM-13][AC-01] Change organisation calls the action once with the client and the chosen organisation", async () => {
    const user = userEvent.setup();
    renderSettings();

    await openPicker(user);
    await choose(user, /Wattle Care/);
    await user.click(within(confirmation()).getByRole("button", { name: "Change organisation" }));

    expect(mocks.change).toHaveBeenCalledTimes(1);
    expect(mocks.change).toHaveBeenCalledWith(CLIENT_ID, "org-wattle");
  });

  it("[FAM-13][AC-01] on success the card names the new organisation, a status says so, the route refreshes and focus returns to Change", async () => {
    const user = userEvent.setup();
    renderSettings();

    await openPicker(user);
    await choose(user, /Wattle Care/);
    await user.click(within(confirmation()).getByRole("button", { name: "Change organisation" }));

    expect(await screen.findByText("Margaret's care has moved to Wattle Care.")).toBeVisible();
    expect(screen.getByText("Currently registered with Wattle Care.")).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Change" })).toHaveFocus();
  });

  it("[FAM-13][AC-01] after a change the new organisation is the marked one in the picker and Banksia can be chosen again", async () => {
    const user = userEvent.setup();
    renderSettings();

    await openPicker(user);
    await choose(user, /Wattle Care/);
    await user.click(within(confirmation()).getByRole("button", { name: "Change organisation" }));
    await screen.findByText("Margaret's care has moved to Wattle Care.");
    await openPicker(user);

    expect(within(picker()).getByRole("radio", { name: /Wattle Care/ })).toBeDisabled();
    expect(within(picker()).getByRole("radio", { name: /Banksia Home Care/ })).toBeEnabled();
  });

  it("[FAM-13][AC-01] a failed change says why, leaves the card on the current organisation, and does not refresh", async () => {
    const user = userEvent.setup();
    mocks.change.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't change the organisation. Try again." },
    });
    renderSettings();

    await openPicker(user);
    await choose(user, /Wattle Care/);
    await user.click(within(confirmation()).getByRole("button", { name: "Change organisation" }));

    expect(await screen.findByText("Couldn't change the organisation. Try again.")).toBeVisible();
    expect(screen.getByText("Currently registered with Banksia Home Care.")).toBeVisible();
    expect(screen.queryByText(/has moved to/i)).not.toBeInTheDocument();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("[FAM-13][AC-01] a rejected action is a failed change, not a crash", async () => {
    const user = userEvent.setup();
    mocks.change.mockRejectedValue(new Error("network"));
    renderSettings();

    await openPicker(user);
    await choose(user, /Wattle Care/);
    await user.click(within(confirmation()).getByRole("button", { name: "Change organisation" }));

    expect(await screen.findByText("Couldn't change the organisation. Try again.")).toBeVisible();
    expect(screen.getByText("Currently registered with Banksia Home Care.")).toBeVisible();
  });

  it("[FAM-13][AC-01] pressing Change organisation twice quickly calls the action once", async () => {
    const user = userEvent.setup();
    let finish: (value: unknown) => void = () => {};
    mocks.change.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderSettings();

    await openPicker(user);
    await choose(user, /Wattle Care/);
    const confirm = within(confirmation()).getByRole("button", { name: "Change organisation" });
    await user.click(confirm);
    await user.click(confirm);

    expect(mocks.change).toHaveBeenCalledTimes(1);
    finish({ ok: true, data: undefined });
    expect(await screen.findByText("Margaret's care has moved to Wattle Care.")).toBeVisible();
  });

  it("[FAM-13][AC-01] the phase 1 answer 'not available yet' is shown as it is, and nothing changes", async () => {
    const user = userEvent.setup();
    mocks.change.mockResolvedValue({
      ok: false,
      error: {
        code: "NOT_AVAILABLE",
        message: "Choosing a new organisation is not available yet.",
      },
    });
    renderSettings();

    await openPicker(user);
    await choose(user, /Wattle Care/);
    await user.click(within(confirmation()).getByRole("button", { name: "Change organisation" }));

    expect(
      await screen.findByText("Choosing a new organisation is not available yet."),
    ).toBeVisible();
    expect(screen.getByText("Currently registered with Banksia Home Care.")).toBeVisible();
  });
});

describe("[FAM-13][AC-06] absent, not disabled", () => {
  it("[FAM-13][AC-06] a client with no organisation has no Change button", () => {
    renderSettings(ORGANISATIONS, { organisationName: undefined });
    expect(screen.queryByRole("button", { name: "Change" })).not.toBeInTheDocument();
  });
});

describe("[FAM-13][AC-04] accessibility", () => {
  it("[FAM-13][AC-04] the picker and the confirmation have no axe violations, and the picker traps Tab", async () => {
    const user = userEvent.setup();
    const { container } = renderSettings();

    await openPicker(user);
    expect(await axe(container)).toHaveNoViolations();

    // Tab cycles inside the dialog: from the last control it wraps to the first.
    const buttons = within(picker()).getAllByRole("button");
    buttons[buttons.length - 1]!.focus();
    await user.tab();
    expect(picker().contains(document.activeElement)).toBe(true);

    await choose(user, /Wattle Care/);
    expect(await axe(container)).toHaveNoViolations();
  });
});
