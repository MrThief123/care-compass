import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsScreen } from "@/features/admin-settings/settings-screen";

/*
 * ADM-10: Organisation info saves through `updateOrganisationSettings` and Reset goes through
 * `requestOwnPasswordReset`. Both are replaced here so each test decides what they return; what they
 * do is covered in src/server/admin/settings-actions.test.ts and tests/integration/.
 */
const mocks = vi.hoisted(() => ({ update: vi.fn(), reset: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/server/admin/settings-actions", () => ({ updateOrganisationSettings: mocks.update }));
vi.mock("@/server/profiles/actions", () => ({ requestOwnPasswordReset: mocks.reset }));

const data = {
  organisation: {
    name: "Banksia Home Care",
    abn: "54 123 456 789",
    phone: "03 9555 0102",
    address: "220 High St, Preston VIC 3072",
  },
};

const RESET_SENT = "We've emailed you a link to reset your password.";
const RESET_FAILED = "Couldn't send the reset link. Try again.";
const SAVE_FAILED = "Couldn't save the organisation details. Try again.";

beforeEach(() => {
  mocks.update.mockImplementation(async (values) => ({ ok: true, data: values }));
  mocks.reset.mockResolvedValue({ ok: true, data: undefined });
});
afterEach(() => vi.resetAllMocks());

const edit = () => userEvent.click(screen.getByRole("button", { name: "Edit" }));

describe("[ADM-10][AC-02] a bad ABN is stopped on the screen", () => {
  it("[ADM-10][AC-02] ABN '123' shows the ABN error and the action is not called", async () => {
    render(<SettingsScreen data={data} />);
    await edit();
    await userEvent.clear(screen.getByLabelText("ABN"));
    await userEvent.type(screen.getByLabelText("ABN"), "123");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByLabelText("ABN")).toHaveAccessibleDescription(
      "Enter an ABN with 11 digits.",
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("[ADM-10][AC-04] Save goes through the server action", () => {
  it("[ADM-10][AC-04] Save sends the trimmed values once, then shows 'Saved.'", async () => {
    render(<SettingsScreen data={data} />);
    await edit();
    await userEvent.clear(screen.getByLabelText("Phone"));
    await userEvent.type(screen.getByLabelText("Phone"), "  03 9555 0199 ");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Saved.")).toBeInTheDocument();
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith({ ...data.organisation, phone: "03 9555 0199" });
  });
});

describe("[ADM-10][AC-05] a failed save", () => {
  it("[ADM-10][AC-05] keeps what was typed, announces the error and never shows 'Saved.'", async () => {
    mocks.update.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: SAVE_FAILED },
    });
    render(<SettingsScreen data={data} />);
    await edit();
    await userEvent.clear(screen.getByLabelText("Address"));
    await userEvent.type(screen.getByLabelText("Address"), "5 High St");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText(SAVE_FAILED)).toBeInTheDocument();
    expect(screen.getByLabelText("Address")).toHaveValue("5 High St");
    expect(screen.queryByText("Saved.")).not.toBeInTheDocument();
  });
});

describe("[ADM-10][AC-06] Reset goes through the server action", () => {
  it("[ADM-10][AC-06] Reset requests the link once and shows the sent message", async () => {
    render(<SettingsScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(await screen.findByText(RESET_SENT)).toBeInTheDocument();
    expect(mocks.reset).toHaveBeenCalledTimes(1);
  });

  it("[ADM-10][AC-06] a failed reset shows the error and not the sent message", async () => {
    mocks.reset.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: RESET_FAILED },
    });
    render(<SettingsScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(await screen.findByText(RESET_FAILED)).toBeInTheDocument();
    expect(screen.queryByText(RESET_SENT)).not.toBeInTheDocument();
  });
});

describe("[ADM-10][AC-07] read-only until Edit, with Cancel", () => {
  it("[ADM-10][AC-07] starts read-only with 'Edit' and no Save or Cancel", () => {
    render(<SettingsScreen data={data} />);
    expect(screen.getByLabelText("Organisation Name")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("ABN")).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("[ADM-10][AC-07] Edit unlocks the fields and shows Save and Cancel", async () => {
    render(<SettingsScreen data={data} />);
    await edit();
    expect(screen.getByLabelText("Phone")).not.toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("[ADM-10][AC-07] Cancel puts the saved values back, clears errors and locks the fields without calling the action", async () => {
    render(<SettingsScreen data={data} />);
    await edit();
    await userEvent.clear(screen.getByLabelText("ABN"));
    await userEvent.type(screen.getByLabelText("ABN"), "123");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByLabelText("ABN")).toHaveValue(data.organisation.abn);
    expect(screen.getByLabelText("ABN")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("ABN")).not.toHaveAccessibleDescription(/11 digits/);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("[ADM-10][AC-07] after a save the fields lock again, and Cancel next time goes back to what was saved", async () => {
    render(<SettingsScreen data={data} />);
    await edit();
    await userEvent.clear(screen.getByLabelText("Phone"));
    await userEvent.type(screen.getByLabelText("Phone"), "03 9555 0199");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).toHaveAttribute("readonly");

    await edit();
    await userEvent.type(screen.getByLabelText("Phone"), "9");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByLabelText("Phone")).toHaveValue("03 9555 0199");
  });

  it("[ADM-10][AC-07] a failed save keeps the fields open for another try", async () => {
    mocks.update.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: SAVE_FAILED },
    });
    render(<SettingsScreen data={data} />);
    await edit();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText(SAVE_FAILED)).toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).not.toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});

describe("[ADM-10][AC-08] a bad phone number is stopped on the screen", () => {
  it.each([
    ["0395", "Enter an Australian phone number, like 03 9555 0102 or +61 3 9555 0102."],
    ["03 9555 O102", "A phone number can only have digits, spaces, + ( ) and -."],
  ])(
    "[ADM-10][AC-08] phone '%s' shows its error and the action is not called",
    async (phone, message) => {
      render(<SettingsScreen data={data} />);
      await edit();
      await userEvent.clear(screen.getByLabelText("Phone"));
      await userEvent.type(screen.getByLabelText("Phone"), phone);
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(screen.getByLabelText("Phone")).toHaveAccessibleDescription(message);
      expect(mocks.update).not.toHaveBeenCalled();
    },
  );

  it("[ADM-10][AC-08] +61 3 9555 0102 is accepted", async () => {
    render(<SettingsScreen data={data} />);
    await edit();
    await userEvent.clear(screen.getByLabelText("Phone"));
    await userEvent.type(screen.getByLabelText("Phone"), "+61 3 9555 0102");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
  });
});
