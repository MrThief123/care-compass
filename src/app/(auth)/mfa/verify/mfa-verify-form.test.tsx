import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const verifyMfaCode = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/server/auth/actions", () => ({
  verifyMfaCode: (...args: unknown[]) => verifyMfaCode(...args),
}));

import { MfaVerifyForm } from "./mfa-verify-form";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("[F0-20][AC-05] sign-in challenge form", () => {
  it("[F0-20][AC-05] clears and focuses the field after a wrong code, announces the error, and a retry sends only the new digits", async () => {
    verifyMfaCode
      .mockResolvedValueOnce({
        ok: false,
        error: { code: "MFA_INVALID_CODE", message: "That code isn't right. Try again." },
      })
      .mockResolvedValueOnce({ ok: true, data: { redirectTo: "/admin/home" } });
    render(<MfaVerifyForm factorId="factor-1" />);
    const field = screen.getByLabelText("6-digit code");

    await userEvent.type(field, "881452");
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That code isn't right");
    await waitFor(() => expect(field).toHaveValue(""));
    expect(field).toHaveFocus();

    await userEvent.type(field, "123456");
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/home"));
    expect(verifyMfaCode).toHaveBeenLastCalledWith({ factorId: "factor-1", code: "123456" });
  });

  it("[F0-20][AC-05] a validation message (not six digits) also clears the field", async () => {
    verifyMfaCode.mockResolvedValue({
      ok: false,
      error: { code: "VALIDATION", message: "Enter the 6-digit code." },
    });
    render(<MfaVerifyForm factorId="factor-1" />);
    const field = screen.getByLabelText("6-digit code");

    await userEvent.type(field, "123");
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Enter the 6-digit code.");
    await waitFor(() => expect(field).toHaveValue(""));
  });
});
