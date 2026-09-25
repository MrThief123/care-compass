import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FamilySettingsView } from "@/features/family-settings/family-settings-view";
import { getClientHeaderSummary, type ClientHeaderSummary } from "@/server/clients/queries";
import { getFamilyContactDetails, type FamilyContactDetails } from "@/server/profiles/queries";

/*
 * FAM-12: the Family info card saves through `updateFamilyContactDetails` and
 * Reset goes through `requestOwnPasswordReset`. The actions are replaced here
 * so each test decides what they return; what they do is covered in
 * src/server/profiles/actions.test.ts and tests/integration/.
 */
const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/server/profiles/actions", () => ({
  updateFamilyContactDetails: mocks.update,
  requestOwnPasswordReset: mocks.reset,
}));

const CLIENT_ID = "client-margaret";
const PROFILE_ID = "profile-helen";

let header: ClientHeaderSummary;
let contact: FamilyContactDetails;

beforeEach(async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  header = await getClientHeaderSummary(CLIENT_ID);
  contact = await getFamilyContactDetails(PROFILE_ID);
  mocks.update.mockImplementation(async (values) => ({
    ok: true,
    data: { profileId: PROFILE_ID, ...values },
  }));
  mocks.reset.mockResolvedValue({ ok: true, data: undefined });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

function renderSettings() {
  return render(<FamilySettingsView header={header} contact={contact} />);
}

async function edit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Edit" }));
}

describe("[FAM-12][AC-01] Save goes through the server action", () => {
  it("[FAM-12][AC-01] Save sends the trimmed values once, then shows 'Saved.' and locks the fields", async () => {
    const user = userEvent.setup();
    renderSettings();

    await edit(user);
    const phone = screen.getByLabelText("Phone");
    await user.clear(phone);
    await user.type(phone, "  0499 111 222 ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: contact.name, phone: "0499 111 222" }),
    );
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).toHaveValue("0499 111 222");
    expect(screen.getByLabelText("Phone")).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("[FAM-12][AC-01] what the action returns is what Cancel goes back to afterwards", async () => {
    const user = userEvent.setup();
    renderSettings();

    await edit(user);
    const phone = screen.getByLabelText("Phone");
    await user.clear(phone);
    await user.type(phone, "0499 111 222");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Saved.");

    await edit(user);
    await user.clear(screen.getByLabelText("Phone"));
    await user.type(screen.getByLabelText("Phone"), "0400 000 000");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByLabelText("Phone")).toHaveValue("0499 111 222");
  });

  it("[FAM-12][AC-01] while saving, Save cannot be pressed again, so one edit saves once", async () => {
    const user = userEvent.setup();
    let finish: (value: unknown) => void = () => {};
    mocks.update.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderSettings();

    await edit(user);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    finish({ ok: true, data: { profileId: PROFILE_ID, name: contact.name } });
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
  });

  it("[FAM-12][AC-01] a failed save says so, keeps the edits and the fields open, and never says 'Saved.'", async () => {
    const user = userEvent.setup();
    mocks.update.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't save your details. Try again." },
    });
    renderSettings();

    await edit(user);
    const phone = screen.getByLabelText("Phone");
    await user.clear(phone);
    await user.type(phone, "0499 111 222");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Couldn't save your details. Try again.")).toBeInTheDocument();
    expect(screen.queryByText("Saved.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).toHaveValue("0499 111 222");
    expect(screen.getByLabelText("Phone")).not.toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("[FAM-12][AC-01] a rejected action (network error) is a failed save, not a crash", async () => {
    const user = userEvent.setup();
    mocks.update.mockRejectedValue(new Error("network"));
    renderSettings();

    await edit(user);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText(/couldn't save your details/i)).toBeInTheDocument();
    expect(screen.queryByText("Saved.")).not.toBeInTheDocument();
  });
});

describe("[FAM-12][AC-02] invalid input", () => {
  it("[FAM-12][AC-02] an email of 'helen@' shows an email error and does not call the action", async () => {
    const user = userEvent.setup();
    renderSettings();

    await edit(user);
    const email = screen.getByLabelText("Email");
    await user.clear(email);
    await user.type(email, "helen@");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(email).toHaveAccessibleDescription("Enter an email address like name@example.com.");
    expect(email).toBeInvalid();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("[FAM-12][AC-02] a field message the server sends is shown on that field, and focus goes to it", async () => {
    const user = userEvent.setup();
    mocks.update.mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Check the highlighted fields.",
        fieldErrors: { phone: "Enter a phone number like 0412 345 678." },
      },
    });
    renderSettings();

    await edit(user);
    await user.click(screen.getByRole("button", { name: "Save" }));

    const phone = await screen.findByLabelText("Phone");
    expect(phone).toHaveAccessibleDescription("Enter a phone number like 0412 345 678.");
    expect(phone).toHaveFocus();
    expect(screen.queryByText("Saved.")).not.toBeInTheDocument();
  });
});

describe("[FAM-12][AC-03] Reset goes through the server action", () => {
  it("[FAM-12][AC-03] Reset requests the email once and then says a link was emailed", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(mocks.reset).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText("We've emailed you a link to reset your password."),
    ).toBeVisible();
  });

  it("[FAM-12][AC-03] the confirmation names no address", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Reset" }));
    const status = await screen.findByText("We've emailed you a link to reset your password.");

    expect(status.textContent).not.toMatch(/@/);
  });

  it("[FAM-12][AC-03] a failed request says the link could not be sent, and never says it was emailed", async () => {
    const user = userEvent.setup();
    mocks.reset.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't send the reset link. Try again." },
    });
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(await screen.findByText("Couldn't send the reset link. Try again.")).toBeVisible();
    expect(screen.queryByText(/emailed you a link/i)).not.toBeInTheDocument();
  });

  it("[FAM-12][AC-03] a rejected action is a failed request, not a crash", async () => {
    const user = userEvent.setup();
    mocks.reset.mockRejectedValue(new Error("network"));
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(await screen.findByText(/couldn't send the reset link/i)).toBeVisible();
    expect(screen.queryByText(/emailed you a link/i)).not.toBeInTheDocument();
  });
});
