import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const enrollMfaFactor = vi.fn();
const verifyMfaCode = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/server/auth/actions", () => ({
  enrollMfaFactor: (...args: unknown[]) => enrollMfaFactor(...args),
  verifyMfaCode: (...args: unknown[]) => verifyMfaCode(...args),
}));

import { MfaEnrollFlow } from "./mfa-enroll-flow";
import { MfaEnrollForm } from "./mfa-enroll-form";
import MfaEnrollPage from "./page";

const RAW_SVG = "<svg xmlns='http://www.w3.org/2000/svg'><rect width='1' height='1'/></svg>";
const DATA_URI = `data:image/svg+xml;utf-8,${RAW_SVG}`;

const enrolled = (over: Partial<{ qrCode: string }> = {}) => ({
  ok: true as const,
  data: { factorId: "factor-1", qrCode: DATA_URI, secret: "JBSWY3DPEHPK3PXP", ...over },
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe("[F0-21][FD-13] QR image is centred", () => {
  it("[F0-21][FD-13] centres the QR code in the card", () => {
    render(<MfaEnrollForm factorId="f" qrCode={DATA_URI} secret="JBSWY3DPEHPK3PXP" />);

    // jsdom has no layout; the real position is checked in a browser (PROGRESS.md).
    expect(screen.getByRole("img", { name: /authenticator/i })).toHaveClass("self-center");
  });

  it("[F0-21][FD-13] asks the auth layout for the wider card so the key fits on one line", () => {
    render(<MfaEnrollForm factorId="f" qrCode={DATA_URI} secret="JBSWY3DPEHPK3PXP" />);

    expect(screen.getByRole("heading", { level: 1 }).closest("[data-wide]")).not.toBeNull();
  });

  it("[F0-21][FD-13] centres the heading, intro and manual key, not the code field", () => {
    render(<MfaEnrollForm factorId="f" qrCode={DATA_URI} secret="JBSWY3DPEHPK3PXP" />);

    expect(screen.getByRole("heading", { level: 1 }).parentElement).toHaveClass("text-center");
    expect(screen.getByTestId("mfa-manual-key").parentElement).toHaveClass("text-center");
    expect(screen.getByLabelText("6-digit code").closest(".text-center")).toBeNull();
  });
});

describe("[F0-20][AC-01] QR image", () => {
  it("[F0-20][AC-01] uses a data: URI value as it is, without wrapping it a second time", () => {
    render(<MfaEnrollForm factorId="f" qrCode={DATA_URI} secret="JBSWY3DPEHPK3PXP" />);

    expect(screen.getByRole("img", { name: /authenticator/i })).toHaveAttribute("src", DATA_URI);
  });

  it("[F0-20][AC-01] wraps raw SVG markup into a data: URI", () => {
    render(<MfaEnrollForm factorId="f" qrCode={RAW_SVG} secret="JBSWY3DPEHPK3PXP" />);

    expect(screen.getByRole("img", { name: /authenticator/i })).toHaveAttribute(
      "src",
      `data:image/svg+xml;utf-8,${encodeURIComponent(RAW_SVG)}`,
    );
  });

  it("[F0-20][AC-01] shows the manual entry key", () => {
    render(<MfaEnrollForm factorId="f" qrCode={DATA_URI} secret="JBSWY3DPEHPK3PXP" />);

    expect(screen.getByText("JBSWY3DPEHPK3PXP")).toBeInTheDocument();
  });
});

describe("[F0-20][AC-04] enrolment starts once, from the browser", () => {
  it("[F0-20][AC-04] rendering the page on the server does not create a factor", async () => {
    await MfaEnrollPage();
    await MfaEnrollPage();

    expect(enrollMfaFactor).not.toHaveBeenCalled();
  });

  it("[F0-20][AC-04] shows a loading state, then the QR and key, calling enrol exactly once under StrictMode", async () => {
    enrollMfaFactor.mockResolvedValue(enrolled());

    render(
      <StrictMode>
        <MfaEnrollFlow />
      </StrictMode>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: /authenticator/i })).toBeInTheDocument();
    expect(screen.getByText("JBSWY3DPEHPK3PXP")).toBeInTheDocument();
    expect(enrollMfaFactor).toHaveBeenCalledTimes(1);
  });

  it("[F0-20][AC-04] a failed enrolment shows the message and a retry that enrols again", async () => {
    enrollMfaFactor
      .mockResolvedValueOnce({
        ok: false,
        error: { code: "UNEXPECTED", message: "Couldn't start MFA enrollment. Try again." },
      })
      .mockResolvedValueOnce(enrolled());

    render(<MfaEnrollFlow />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't start MFA enrollment. Try again.",
    );
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByRole("img", { name: /authenticator/i })).toBeInTheDocument();
    expect(enrollMfaFactor).toHaveBeenCalledTimes(2);
  });
});

describe("[F0-20][AC-05] code field after a failed attempt", () => {
  it("[F0-20][AC-05] clears and focuses the field, announces the error, and a retry sends only the new digits", async () => {
    verifyMfaCode
      .mockResolvedValueOnce({
        ok: false,
        error: { code: "MFA_INVALID_CODE", message: "That code isn't right. Try again." },
      })
      .mockResolvedValueOnce({ ok: true, data: { redirectTo: "/admin/home" } });
    render(<MfaEnrollForm factorId="factor-1" qrCode={DATA_URI} secret="JBSWY3DPEHPK3PXP" />);
    const field = screen.getByLabelText("6-digit code");

    await userEvent.type(field, "881452");
    await userEvent.click(screen.getByRole("button", { name: /verify and continue/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That code isn't right");
    await waitFor(() => expect(field).toHaveValue(""));
    await waitFor(() => expect(field).toHaveFocus());

    await userEvent.type(field, "123456");
    await userEvent.click(screen.getByRole("button", { name: /verify and continue/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/home"));
    expect(verifyMfaCode).toHaveBeenLastCalledWith({ factorId: "factor-1", code: "123456" });
  });

  it("[F0-20][AC-06] tells the admin to reload when the factor has expired", async () => {
    verifyMfaCode.mockResolvedValue({
      ok: false,
      error: {
        code: "MFA_FACTOR_MISSING",
        message: "This setup has expired. Reload the page to start again.",
      },
    });
    render(<MfaEnrollForm factorId="factor-1" qrCode={DATA_URI} secret="JBSWY3DPEHPK3PXP" />);

    await userEvent.type(screen.getByLabelText("6-digit code"), "123456");
    await userEvent.click(screen.getByRole("button", { name: /verify and continue/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Reload the page");
  });
});
