import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ push: vi.fn(), setPassword: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/server/auth/actions", () => ({ setPassword: mocks.setPassword }));

import { SetPasswordForm } from "./set-password-form";

beforeEach(() => {
  mocks.push.mockReset();
  mocks.setPassword.mockReset();
});

describe("[F0-24][AC-03] /set-password form", () => {
  it("[F0-24][AC-03] shows the welcome heading and the same field as reset", () => {
    render(<SetPasswordForm />);
    expect(screen.getByRole("heading", { name: "Set your password" })).toBeVisible();
    expect(screen.getByLabelText("New password")).toBeVisible();
    expect(screen.getByText("At least 8 characters.")).toBeVisible();
  });

  it("[F0-24][AC-03] saving sends the carer to the role home the action returns", async () => {
    mocks.setPassword.mockResolvedValue({ ok: true, data: { redirectTo: "/carer/home" } });
    render(<SetPasswordForm />);
    await userEvent.type(screen.getByLabelText("New password"), "a long enough password");
    await userEvent.click(screen.getByRole("button", { name: "Save password" }));
    expect(mocks.setPassword).toHaveBeenCalledWith({ password: "a long enough password" });
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/carer/home"));
  });

  it("[F0-24][AC-02] shows the action's error and does not navigate", async () => {
    mocks.setPassword.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Your link has expired. Request a new one." },
    });
    render(<SetPasswordForm />);
    await userEvent.type(screen.getByLabelText("New password"), "a long enough password");
    await userEvent.click(screen.getByRole("button", { name: "Save password" }));
    expect(await screen.findByText("Your link has expired. Request a new one.")).toBeVisible();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("[F0-24][AC-03] has no axe violations", async () => {
    const { container } = render(<SetPasswordForm />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
