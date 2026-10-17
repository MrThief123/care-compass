import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FamilySettingsView } from "@/features/family-settings/family-settings-view";
import { getClientHeaderSummary, type ClientHeaderSummary } from "@/server/clients/queries";
import { getFamilyContactDetails, type FamilyContactDetails } from "@/server/profiles/queries";

import { ClientDetailsCard } from "./client-details-card";

/*
 * [F0-28] '<First>'s details' on Family Settings (AC-06 to AC-10, AC-16). The action is mocked;
 * the contract is src/server/clients/client-details-actions.test.ts.
 */
const mocks = vi.hoisted(() => ({ saveClientDetails: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mocks.refresh }),
}));
vi.mock("@/server/clients/client-details-actions", () => ({
  saveClientDetails: mocks.saveClientDetails,
}));

const CLIENT_ID = "client-margaret";

const DETAILS = {
  dateOfBirth: "1952-03-02",
  email: "margaret@example.com",
  phone: "0400 111 222",
  suburb: "Brunswick",
  emergencyContactName: "Helen Doyle",
  emergencyContactRelationship: "Daughter",
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-14T01:00:00.000Z"));
  mocks.saveClientDetails.mockResolvedValue({ ok: true, data: undefined });
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

function renderCard(details = DETAILS) {
  return render(<ClientDetailsCard clientId={CLIENT_ID} firstName="Margaret" details={details} />);
}

function card() {
  return within(screen.getByRole("region", { name: "Margaret's details" }));
}

function field(label: string) {
  return card().getByLabelText(new RegExp(`^${label}`));
}

describe("[F0-28] ClientDetailsCard", () => {
  it("[F0-28][AC-06] shows the saved values read-only, with age beside the date of birth", () => {
    renderCard();
    expect(field("Date of birth")).toHaveValue("1952-03-02");
    expect(card().getByText("Age 74")).toBeInTheDocument();
    expect(field("Phone")).toHaveValue("0400 111 222");
    expect(field("Address")).toHaveValue("");
    for (const control of card().getAllByRole("textbox")) {
      expect(control).toHaveAttribute("readonly");
    }
    expect(card().getByRole("button", { name: "Edit Margaret's details" })).toBeInTheDocument();
  });

  it("[F0-28][AC-07] Edit, change the phone, Save: saved, announced, read-only again", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCard();
    await user.click(card().getByRole("button", { name: "Edit Margaret's details" }));
    await user.clear(field("Phone"));
    await user.type(field("Phone"), "0400 999 888");
    await user.click(card().getByRole("button", { name: "Save Margaret's details" }));

    expect(mocks.saveClientDetails).toHaveBeenCalledWith(CLIENT_ID, {
      dateOfBirth: "1952-03-02",
      email: "margaret@example.com",
      phone: "0400 999 888",
      address: "",
      suburb: "Brunswick",
      emergencyContactName: "Helen Doyle",
      emergencyContactRelationship: "Daughter",
      emergencyContactPhone: "",
    });
    expect(card().getByRole("status")).toHaveTextContent("Saved.");
    expect(field("Phone")).toHaveAttribute("readonly");
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("[F0-28][AC-07] Cancel restores the saved values and saves nothing", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCard();
    await user.click(card().getByRole("button", { name: "Edit Margaret's details" }));
    await user.clear(field("Suburb"));
    await user.type(field("Suburb"), "Coburg");
    await user.click(card().getByRole("button", { name: "Cancel editing Margaret's details" }));

    expect(field("Suburb")).toHaveValue("Brunswick");
    expect(field("Suburb")).toHaveAttribute("readonly");
    expect(mocks.saveClientDetails).not.toHaveBeenCalled();
  });

  it("[F0-28][AC-08] clearing the email sends it blank", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCard();
    await user.click(card().getByRole("button", { name: "Edit Margaret's details" }));
    await user.clear(field("Email"));
    await user.click(card().getByRole("button", { name: "Save Margaret's details" }));
    expect(mocks.saveClientDetails).toHaveBeenCalledWith(
      CLIENT_ID,
      expect.objectContaining({ email: "" }),
    );
  });

  it("[F0-28][AC-09] an invalid value shows its error, takes focus and nothing is saved", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCard();
    await user.click(card().getByRole("button", { name: "Edit Margaret's details" }));
    await user.clear(field("Email"));
    await user.type(field("Email"), "not-an-email");
    await user.clear(field("Emergency contact phone"));
    await user.type(field("Emergency contact phone"), "12");
    await user.click(card().getByRole("button", { name: "Save Margaret's details" }));

    expect(card().getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(card().getByText("Enter a valid phone number.")).toBeInTheDocument();
    expect(field("Email")).toHaveFocus();
    expect(mocks.saveClientDetails).not.toHaveBeenCalled();
  });

  it("[F0-28][AC-10] a failed save shows the message and keeps the typed values", async () => {
    mocks.saveClientDetails.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "x" },
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCard();
    await user.click(card().getByRole("button", { name: "Edit Margaret's details" }));
    await user.clear(field("Suburb"));
    await user.type(field("Suburb"), "Coburg");
    await user.click(card().getByRole("button", { name: "Save Margaret's details" }));

    expect(card().getByRole("status")).toHaveTextContent(
      "Couldn't save Margaret's details. Try again.",
    );
    expect(field("Suburb")).toHaveValue("Coburg");
    expect(field("Suburb")).not.toHaveAttribute("readonly");
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("[F0-28][AC-16] axe clean read-only and while editing; buttons are 44px tall", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = renderCard();
    expect(await axe(container)).toHaveNoViolations();
    await user.click(card().getByRole("button", { name: "Edit Margaret's details" }));
    expect(await axe(container)).toHaveNoViolations();
    for (const button of card().getAllByRole("button")) {
      expect(button.className).toMatch(/\bh-11\b|\bmin-h-11\b/);
    }
  });
});

describe("[F0-28][AC-06] Family Settings shows the card", () => {
  let header: ClientHeaderSummary;
  let contact: FamilyContactDetails;

  beforeEach(async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    header = await getClientHeaderSummary(CLIENT_ID);
    contact = await getFamilyContactDetails("profile-helen");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("[F0-28][AC-06] the card appears on Settings when details are passed", () => {
    render(
      <FamilySettingsView
        header={header}
        contact={contact}
        organisations={[]}
        clientDetails={{}}
      />,
    );
    expect(screen.getByRole("region", { name: "Margaret's details" })).toBeInTheDocument();
  });
});
