import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CarerSettingsView } from "@/features/carer-settings/carer-settings-view";
import type { CarerContactDetails } from "@/server/profiles/queries";

/*
 * CAR-09: My info saves through `updateCarerContactDetails` and Reset goes
 * through `requestOwnPasswordReset`. The actions are replaced here so each test
 * decides what they return; what they do is covered in
 * src/server/profiles/carer-actions.test.ts and tests/integration/.
 */
const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/server/profiles/actions", () => ({
  updateCarerContactDetails: mocks.update,
  requestOwnPasswordReset: mocks.reset,
}));

const AISHA: CarerContactDetails = {
  profileId: "staff-aisha",
  name: "Aisha Rahman",
  phone: "0423 987 654",
  email: "aisha.r@banksiahomecare.com.au",
  role: "Registered Nurse",
};

const RESET_SENT = "We've emailed you a link to reset your password.";
const RESET_FAILED = "Couldn't send the reset link. Try again.";
const SAVE_FAILED = "Couldn't save your details. Try again.";

beforeEach(() => {
  mocks.update.mockImplementation(async (values) => ({
    ok: true,
    data: { profileId: AISHA.profileId, role: AISHA.role, ...values },
  }));
  mocks.reset.mockResolvedValue({ ok: true, data: undefined });
});

afterEach(() => {
  vi.resetAllMocks();
});

function field(label: string) {
  return screen.getByRole("textbox", { name: label });
}

async function edit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Edit" }));
}

describe("[CAR-09][AC-04] Save goes through the server action", () => {
  it("[CAR-09][AC-04] Save sends the trimmed name, phone and email once, then shows 'Saved.' and locks the fields", async () => {
    const user = userEvent.setup();
    render(<CarerSettingsView contact={AISHA} />);

    await edit(user);
    await user.clear(field("Phone"));
    await user.type(field("Phone"), "  0400 111 222 ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Saved.")).toBeInTheDocument();
    expect(mocks.update).toHaveBeenCalledTimes(1);
    // Exactly these three: no role, job title, address or id from the screen.
    expect(mocks.update).toHaveBeenCalledWith({
      name: "Aisha Rahman",
      phone: "0400 111 222",
      email: "aisha.r@banksiahomecare.com.au",
    });
    expect(field("Phone")).toHaveAttribute("readonly");
  });

  it("[CAR-09][AC-04] what the action returns is what Cancel goes back to afterwards", async () => {
    const user = userEvent.setup();
    render(<CarerSettingsView contact={AISHA} />);

    await edit(user);
    await user.clear(field("Phone"));
    await user.type(field("Phone"), "0400 111 222");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Saved.");

    await edit(user);
    await user.clear(field("Phone"));
    await user.type(field("Phone"), "0499 000 000");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(field("Phone")).toHaveValue("0400 111 222");
  });

  it("[CAR-09][AC-04] while saving, Save cannot be pressed again, so one edit saves once", async () => {
    const user = userEvent.setup();
    let finish: (value: unknown) => void = () => {};
    mocks.update.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<CarerSettingsView contact={AISHA} />);

    await edit(user);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    finish({ ok: true, data: { ...AISHA } });
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
  });

  it("[CAR-09][AC-04] Role stays read-only and is never sent, even in edit mode", async () => {
    const user = userEvent.setup();
    render(<CarerSettingsView contact={AISHA} />);

    await edit(user);

    expect(field("Role")).toHaveAttribute("readonly");
    expect(field("Role")).toHaveValue("Registered Nurse");
  });
});

describe("[CAR-09][AC-05] a failed save is reported, not hidden", () => {
  it("[CAR-09][AC-05] a failed save says so, keeps the edits and the fields open, and never says 'Saved.'", async () => {
    const user = userEvent.setup();
    mocks.update.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: SAVE_FAILED },
    });
    render(<CarerSettingsView contact={AISHA} />);

    await edit(user);
    await user.clear(field("Phone"));
    await user.type(field("Phone"), "0400 111 222");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText(SAVE_FAILED)).toBeInTheDocument();
    expect(screen.queryByText("Saved.")).not.toBeInTheDocument();
    expect(field("Phone")).toHaveValue("0400 111 222");
    expect(field("Phone")).not.toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("[CAR-09][AC-05] a rejected action (network error) is a failed save, not a crash", async () => {
    const user = userEvent.setup();
    mocks.update.mockRejectedValue(new Error("network"));
    render(<CarerSettingsView contact={AISHA} />);

    await edit(user);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText(SAVE_FAILED)).toBeInTheDocument();
    expect(screen.queryByText("Saved.")).not.toBeInTheDocument();
  });

  it("[CAR-09][AC-05] the server's per-field message shows on that field", async () => {
    const user = userEvent.setup();
    mocks.update.mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Check the highlighted fields.",
        fieldErrors: { email: "Enter an email address like name@example.com." },
      },
    });
    render(<CarerSettingsView contact={AISHA} />);

    await edit(user);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Enter an email address like name@example.com."),
    ).toBeInTheDocument();
    expect(field("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText("Saved.")).not.toBeInTheDocument();
  });

  it("[CAR-09][AC-05] a client-side error still stops the save before the action is called", async () => {
    const user = userEvent.setup();
    render(<CarerSettingsView contact={AISHA} />);

    await edit(user);
    await user.clear(field("Name"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Enter your name.")).toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("[CAR-09][AC-03] Reset goes through the server action", () => {
  it("[CAR-09][AC-03] Reset requests the email once and then says it was sent", async () => {
    const user = userEvent.setup();
    render(<CarerSettingsView contact={AISHA} />);

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(await screen.findByText(RESET_SENT)).toBeInTheDocument();
    expect(mocks.reset).toHaveBeenCalledTimes(1);
    // No address from the screen: the server uses the session's login email.
    expect(mocks.reset).toHaveBeenCalledWith();
  });

  it("[CAR-09][AC-03] a failed reset says it could not send, and never says it was sent", async () => {
    const user = userEvent.setup();
    mocks.reset.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: RESET_FAILED },
    });
    render(<CarerSettingsView contact={AISHA} />);

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(await screen.findByText(RESET_FAILED)).toBeInTheDocument();
    expect(screen.queryByText(RESET_SENT)).not.toBeInTheDocument();
  });

  it("[CAR-09][AC-03] a rejected reset action is reported as a failure, not a crash", async () => {
    const user = userEvent.setup();
    mocks.reset.mockRejectedValue(new Error("network"));
    render(<CarerSettingsView contact={AISHA} />);

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(await screen.findByText(RESET_FAILED)).toBeInTheDocument();
    expect(screen.queryByText(RESET_SENT)).not.toBeInTheDocument();
  });
});
