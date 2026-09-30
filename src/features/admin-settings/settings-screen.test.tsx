import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsScreen } from "./settings-screen";

/* Save and Reset call server actions (ADM-10); they are replaced here, see settings-wiring.test.tsx. */
const mocks = vi.hoisted(() => ({ update: vi.fn(), reset: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/server/admin/settings-actions", () => ({ updateOrganisationSettings: mocks.update }));
vi.mock("@/server/profiles/actions", () => ({ requestOwnPasswordReset: mocks.reset }));

beforeEach(() => {
  mocks.update.mockReset().mockImplementation(async (values) => ({ ok: true, data: values }));
  mocks.reset.mockReset().mockResolvedValue({ ok: true, data: undefined });
});

const data = {
  organisation: {
    name: "Banksia Home Care",
    abn: "54 123 456 789",
    phone: "03 9555 0102",
    address: "220 High St, Preston VIC 3072",
  },
};
describe("Admin Settings", () => {
  it("[ADM-UI-05][AC-01] shows all organisation details", () => {
    render(<SettingsScreen data={data} />);
    expect(screen.getByLabelText("Organisation Name")).toHaveValue(data.organisation.name);
    expect(screen.getByLabelText("ABN")).toHaveValue(data.organisation.abn);
    expect(screen.getByLabelText("Phone")).toHaveValue(data.organisation.phone);
    expect(screen.getByLabelText("Address")).toHaveValue(data.organisation.address);
  });
  it("[ADM-UI-05][AC-01] saves changes without mutating the props it was given", async () => {
    render(<SettingsScreen data={data} />);
    await userEvent.clear(screen.getByLabelText("Organisation Name"));
    await userEvent.type(screen.getByLabelText("Organisation Name"), "Banksia Care");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
    expect(screen.getByLabelText("Organisation Name")).toHaveValue("Banksia Care");
    expect(data.organisation.name).toBe("Banksia Home Care");
  });
  it("[ADM-UI-05][AC-01] validates missing organisation name and ABN format", async () => {
    render(<SettingsScreen data={data} />);
    await userEvent.clear(screen.getByLabelText("Organisation Name"));
    await userEvent.clear(screen.getByLabelText("ABN"));
    await userEvent.type(screen.getByLabelText("ABN"), "123");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByLabelText("Organisation Name")).toHaveAccessibleDescription(
      "Enter an organisation name.",
    );
    expect(screen.getByLabelText("ABN")).toHaveAccessibleDescription(
      "Enter an ABN with 11 digits.",
    );
    expect(screen.getByRole("status")).not.toHaveTextContent("saved");
  });
  it("[ADM-UI-05][AC-01] clears saved feedback when a field changes", async () => {
    render(<SettingsScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Address"), " Suite 2");
    expect(screen.queryByText("Saved.")).not.toBeInTheDocument();
  });
  it("[ADM-UI-05][AC-01] reset does not change the organisation details", async () => {
    render(<SettingsScreen data={data} />);
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(await screen.findByText(/emailed you a link/)).toBeInTheDocument();
    expect(screen.getByLabelText("Organisation Name")).toHaveValue(data.organisation.name);
  });
  it("[ADM-UI-05][AC-01] missing organisation shows an empty state", () => {
    render(<SettingsScreen data={{ organisation: null }} />);
    expect(screen.getByText("No organisation details")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();
  });
  it("[ADM-UI-05][AC-01] has no detectable accessibility violations", async () => {
    const { container } = render(<SettingsScreen data={data} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
