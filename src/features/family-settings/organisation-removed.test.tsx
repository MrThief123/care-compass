import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FamilySettingsView } from "@/features/family-settings/family-settings-view";
import { getClientHeaderSummary, type ClientHeaderSummary } from "@/server/clients/queries";
import { getFamilyContactDetails, type FamilyContactDetails } from "@/server/profiles/queries";

/*
 * ADM-05 (FD-04, human direction 2026-10-03): when the organisation has removed the client, Settings
 * shows a banner beside Change organisation and a 'Choose organisation' button that opens the FAM-13
 * picker. No notification of any kind. The action is replaced; what it does is covered by FAM-13's
 * tests and the pgTAP file for ADM-05.
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

// No organisation is current: the client was removed.
const CHOICES = [
  { id: "org-banksia", name: "Banksia Home Care", isCurrent: false },
  { id: "org-wattle", name: "Wattle Care", isCurrent: false },
];

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

function renderSettings(overrides: Partial<ClientHeaderSummary>, organisations = CHOICES) {
  return render(
    <FamilySettingsView
      header={{ ...header, ...overrides }}
      contact={contact}
      organisations={organisations}
    />,
  );
}

const REMOVED = { organisationName: undefined, organisationRemoved: true } as const;
const banner = () => screen.getByRole("region", { name: "Organisation removed" });

describe("[ADM-05][AC-08] the banner on Settings", () => {
  it("[ADM-05][AC-08] says the organisation removed the client and a new one must be chosen, beside Change organisation", () => {
    renderSettings(REMOVED);

    expect(banner()).toHaveTextContent(/Your organisation has removed Margaret/);
    expect(banner()).toHaveTextContent(/Choose a new organisation/);
    expect(within(banner()).getByRole("button", { name: "Choose organisation" })).toBeVisible();
    // The Change organisation card is still there; the banner is part of it, not a toast.
    expect(screen.getByRole("heading", { name: "Change organisation" })).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("[ADM-05][AC-08] 'Choose organisation' opens the picker with no organisation marked current", async () => {
    const user = userEvent.setup();
    renderSettings(REMOVED);

    await user.click(screen.getByRole("button", { name: "Choose organisation" }));

    const picker = screen.getByRole("dialog", { name: "Choose a new organisation" });
    const radios = within(picker).getAllByRole("radio");
    expect(radios.map((radio) => radio.getAttribute("value"))).toEqual([
      "org-banksia",
      "org-wattle",
    ]);
    for (const radio of radios) expect(radio).toBeEnabled();
  });

  it("[ADM-05][AC-08] choosing one and confirming moves the client and clears the banner", async () => {
    const user = userEvent.setup();
    renderSettings(REMOVED);

    await user.click(screen.getByRole("button", { name: "Choose organisation" }));
    const picker = screen.getByRole("dialog", { name: "Choose a new organisation" });
    await user.click(within(picker).getByRole("radio", { name: /Wattle Care/ }));
    await user.click(within(picker).getByRole("button", { name: "Continue" }));

    const confirmation = screen.getByRole("dialog", { name: "Change organisation?" });
    expect(confirmation).not.toHaveTextContent(/undefined/);
    await user.click(within(confirmation).getByRole("button", { name: "Change organisation" }));

    expect(mocks.change).toHaveBeenCalledExactlyOnceWith(CLIENT_ID, "org-wattle");
    expect(await screen.findByText("Margaret's care has moved to Wattle Care.")).toBeVisible();
    expect(screen.queryByRole("region", { name: "Organisation removed" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Choose organisation" })).not.toBeInTheDocument();
  });

  it("[ADM-05][AC-08] a failed change keeps the banner", async () => {
    mocks.change.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't change the organisation. Try again." },
    });
    const user = userEvent.setup();
    renderSettings(REMOVED);

    await user.click(screen.getByRole("button", { name: "Choose organisation" }));
    const picker = screen.getByRole("dialog", { name: "Choose a new organisation" });
    await user.click(within(picker).getByRole("radio", { name: /Wattle Care/ }));
    await user.click(within(picker).getByRole("button", { name: "Continue" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Change organisation?" })).getByRole("button", {
        name: "Change organisation",
      }),
    );

    expect(await screen.findByText("Couldn't change the organisation. Try again.")).toBeVisible();
    expect(banner()).toBeVisible();
  });

  it("[ADM-05][AC-08] with organisationRemoved false there is no banner and no Choose button", () => {
    renderSettings({ organisationRemoved: false });

    expect(screen.queryByRole("region", { name: "Organisation removed" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Choose organisation" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change" })).toBeVisible();
  });

  it("[ADM-05][AC-08] a client that never had an organisation has no banner or Change, but can choose one (CHG: register from Settings)", async () => {
    const user = userEvent.setup();
    renderSettings({ organisationName: undefined, organisationRemoved: false });

    expect(screen.queryByRole("region", { name: "Organisation removed" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change" })).not.toBeInTheDocument();
    expect(screen.getByText("Not registered with an organisation.")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Choose organisation" }));
    await user.click(screen.getByRole("radio", { name: /Wattle Care/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(/gives them access to Margaret/);
    await user.click(screen.getByRole("button", { name: "Change organisation" }));

    expect(mocks.change).toHaveBeenCalledWith(expect.any(String), "org-wattle");
  });

  it("[ADM-05][AC-08] with no organisation and none to choose from there is no Choose button", () => {
    renderSettings({ organisationName: undefined, organisationRemoved: false }, []);

    expect(screen.queryByRole("button", { name: "Choose organisation" })).not.toBeInTheDocument();
    expect(screen.getByText("Not registered with an organisation.")).toBeVisible();
  });

  it("[ADM-05][AC-08] the banner and the picker have no detectable accessibility violations", async () => {
    const user = userEvent.setup();
    const { container } = renderSettings(REMOVED);
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("button", { name: "Choose organisation" }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("[ADM-05][AC-08] a long client name wraps inside the banner", () => {
    const longName = "Bartholomew-Montgomery".repeat(5);
    renderSettings({ ...REMOVED, firstName: longName });

    expect(banner()).toHaveTextContent(longName);
    expect(banner().className).toMatch(/min-w-0|break-words|\[overflow-wrap:anywhere\]/);
  });
});
