import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SignUpForm } from "./sign-up-form";

/*
 * [F0-28] The optional 'More about them' group on family sign-up (AC-01, AC-04, AC-16). The
 * action is mocked; what it does with the values is src/server/auth/sign-up-client-details.test.ts.
 */
const mocks = vi.hoisted(() => ({ signUp: vi.fn(), push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/server/auth/actions", () => ({ signUp: mocks.signUp }));

afterEach(() => vi.resetAllMocks());

const DETAIL_LABELS = [
  "Their date of birth",
  "Their email",
  "Their phone",
  "Their address",
  "Their suburb",
  "Emergency contact name",
  "Emergency contact relationship",
  "Emergency contact phone",
];

function group() {
  return screen.getByRole("group", { name: /More about them/ });
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Your first name/), "Helen");
  await user.type(screen.getByLabelText(/^Your last name/), "Doyle");
  await user.type(screen.getByLabelText(/^Their first name/), "Margaret");
  await user.type(screen.getByLabelText(/^Their last name/), "Doyle");
  await user.type(screen.getByLabelText(/^Email/), "helen@example.com");
  await user.type(screen.getByLabelText(/^Password/), "secret123");
  await user.type(screen.getByLabelText(/^Confirm password/), "secret123");
}

describe("[F0-28] sign-up 'More about them'", () => {
  it("[F0-28][AC-01] family sign-up shows the eight optional fields in a labelled group", () => {
    render(<SignUpForm />);
    const fields = within(group());
    for (const label of DETAIL_LABELS) {
      const control = fields.getByLabelText(new RegExp(`^${label}`));
      expect(control).not.toBeRequired();
    }
    expect(fields.getByLabelText(/^Their date of birth/)).toHaveAttribute("type", "date");
    expect(fields.getByLabelText(/^Their email/)).toHaveAttribute("type", "email");
    expect(fields.getByLabelText(/^Their phone/)).toHaveAttribute("type", "tel");
    expect(fields.getByLabelText(/^Emergency contact phone/)).toHaveAttribute("type", "tel");
  });

  it("[F0-28][AC-01] organisation sign-up does not show the group", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    await user.click(screen.getByRole("radio", { name: /Organisation/ }));
    expect(screen.queryByRole("group", { name: /More about them/ })).toBeNull();
  });

  it("[F0-28][AC-03] the details are sent with the sign-up", async () => {
    const user = userEvent.setup();
    mocks.signUp.mockResolvedValue({ ok: true, data: { redirectTo: "/family/x/home" } });
    render(<SignUpForm />);
    await fillRequired(user);
    const fields = within(group());
    await user.type(fields.getByLabelText(/^Their phone/), "0400 111 222");
    await user.type(fields.getByLabelText(/^Their suburb/), "Brunswick");
    await user.click(screen.getByRole("button", { name: "Create an account" }));

    expect(mocks.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        accountType: "family",
        clientPhone: "0400 111 222",
        clientSuburb: "Brunswick",
        clientEmail: "",
      }),
    );
  });

  it("[F0-28][AC-04] an invalid detail shows its error and nothing is sent", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    await fillRequired(user);
    await user.type(within(group()).getByLabelText(/^Their email/), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Create an account" }));

    expect(within(group()).getByLabelText(/^Their email/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("[F0-28][AC-16] the form with the group is axe clean", async () => {
    const { container } = render(<SignUpForm />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
