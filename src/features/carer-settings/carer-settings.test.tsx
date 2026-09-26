import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Loading from "@/app/(carer)/carer/settings/loading";
import CarerSettingsPage from "@/app/(carer)/carer/settings/page";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  getCurrentUser: vi.fn(),
  getCarerContactDetails: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mocks.refresh }),
  usePathname: () => "/carer/settings",
}));
vi.mock("@/server/auth/queries", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));
vi.mock("@/server/profiles/queries", () => ({
  getCarerContactDetails: mocks.getCarerContactDetails,
}));

/*
 * The screen reads only through the `src/server/**` contract, so these tests
 * replace that contract with Aisha's details as drawn in
 * docs/design/screens/carer-04-settings.png (FD-01). The contract's own test
 * runs against `src/mocks` (src/server/profiles/queries.test.ts, T-08).
 */
const CARER_ID = "staff-aisha";

const AISHA_USER = {
  profileId: CARER_ID,
  role: "carer",
  organisationId: "org-banksia",
  firstName: "Aisha",
  lastName: "Rahman",
};

const AISHA = {
  profileId: CARER_ID,
  name: "Aisha Rahman",
  phone: "0423 987 654",
  email: "aisha.r@banksiahomecare.com.au",
  role: "Registered Nurse",
};

const RESET_TEXT = "We'll email you a secure link to reset your credentials.";
const RESET_SENT = "We've emailed you a link to reset your password.";

async function renderSettings() {
  const page = await CarerSettingsPage();
  return render(page);
}

function field(label: string) {
  return screen.getByRole("textbox", { name: label });
}

beforeEach(() => {
  mocks.getCurrentUser.mockResolvedValue(AISHA_USER);
  mocks.getCarerContactDetails.mockResolvedValue(AISHA);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("[CAR-UI-04] Carer Settings", () => {
  it("[CAR-UI-04][AC-01] My info shows 'Aisha Rahman', '0423 987 654', 'aisha.r@banksiahomecare.com.au' and 'Registered Nurse'", async () => {
    await renderSettings();

    expect(screen.getByRole("heading", { name: "My info" })).toBeInTheDocument();
    expect(field("Name")).toHaveValue("Aisha Rahman");
    expect(field("Phone")).toHaveValue("0423 987 654");
    expect(field("Email")).toHaveValue("aisha.r@banksiahomecare.com.au");
    expect(field("Role")).toHaveValue("Registered Nurse");
    expect(mocks.getCarerContactDetails).toHaveBeenCalledWith(CARER_ID);
  });

  it("[CAR-UI-04][AC-01] My info is read-only with no Edit or Save button (FD-03, PD-054)", async () => {
    await renderSettings();

    for (const label of ["Name", "Phone", "Email", "Role"]) {
      expect(field(label)).toHaveAttribute("readonly");
    }
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("[CAR-UI-04][AC-02] the Reset card reads the secure-link copy with a 'Reset' button, and pressing it announces the link was sent", async () => {
    await renderSettings();

    expect(screen.getByRole("heading", { name: "Reset username / password" })).toBeInTheDocument();
    expect(screen.getByText(RESET_TEXT)).toBeInTheDocument();
    expect(screen.queryByText(RESET_SENT)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByRole("status")).toHaveTextContent(RESET_SENT);
  });
});

describe("[CAR-UI-04] Carer Settings empty, error and loading states", () => {
  it("[CAR-UI-04][AC-01] a rejected contract read shows the error state, Try again refreshes, and no message is logged", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getCarerContactDetails.mockRejectedValue(new Error("Aisha Rahman secret"));
    await renderSettings();

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "My info" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.refresh).toHaveBeenCalledTimes(1);

    const logged = errorLog.mock.calls.flat().map(String).join(" ");
    expect(logged).not.toContain("Aisha Rahman secret");
  });

  it("[CAR-UI-04][AC-01] loading skeleton announces itself as loading and holds no data", () => {
    render(<Loading />);

    expect(screen.getAllByRole("status", { name: "Loading" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Aisha Rahman")).not.toBeInTheDocument();
  });

  it("[CAR-UI-04][AC-01] a carer with no phone gets an empty Phone field", async () => {
    mocks.getCarerContactDetails.mockResolvedValue({ ...AISHA, phone: undefined });
    await renderSettings();

    expect(field("Phone")).toHaveValue("");
    expect(field("Name")).toHaveValue("Aisha Rahman");
  });
});

describe("[CAR-UI-04] Carer Settings accessibility (REQ-N2)", () => {
  it("[CAR-UI-04][AC-01] populated screen has no axe violations", async () => {
    const { container } = await renderSettings();

    expect(await axe(container)).toHaveNoViolations();
  });

  it("[CAR-UI-04][AC-01] error state has no axe violations", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getCarerContactDetails.mockRejectedValue(new Error("x"));
    const { container } = await renderSettings();

    expect(await axe(container)).toHaveNoViolations();
  });

  it("[CAR-UI-04][AC-01] loading skeleton has no axe violations", async () => {
    const { container } = render(<Loading />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
