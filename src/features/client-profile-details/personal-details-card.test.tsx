import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CarerInfoView } from "@/features/carer-patients/carer-info-view";
import { FamilyInfoView } from "@/features/family-info/family-info-view";

import { PersonalDetailsCard } from "./personal-details-card";

/*
 * [F0-28] The read-only 'Personal details' card on Client Details (AC-11, AC-12, AC-16), alone and
 * inside the Family (also Admin's) and Carer views.
 */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const FULL = {
  dateOfBirth: "1952-03-02",
  email: "margaret@example.com",
  phone: "0400 111 222",
  address: "12 Banksia Street",
  suburb: "Brunswick",
  emergencyContactName: "Helen Doyle",
  emergencyContactRelationship: "Daughter",
  emergencyContactPhone: "+61 400 333 444",
};

const EMPTY_INFO = { sections: [], documents: [] };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-14T01:00:00.000Z"));
});

afterEach(() => vi.useRealTimers());

function card() {
  return within(screen.getByRole("region", { name: "Personal details" }));
}

/** The text of the definition beside a term. */
function valueOf(term: string) {
  const dt = card().getByText(term, { selector: "dt" });
  return dt.nextElementSibling?.textContent;
}

describe("[F0-28] PersonalDetailsCard", () => {
  it("[F0-28][AC-11] shows age with the birth date, contact details, address and emergency contact", () => {
    render(<PersonalDetailsCard details={FULL} />);
    expect(valueOf("Age")).toBe("74 (born 2 Mar 1952)");
    expect(valueOf("Email")).toBe("margaret@example.com");
    expect(valueOf("Phone")).toBe("0400 111 222");
    expect(valueOf("Address")).toBe("12 Banksia Street, Brunswick");
    expect(valueOf("Emergency contact")).toBe("Helen Doyle (Daughter) · +61 400 333 444");
  });

  it("[F0-28][AC-11] leaves out what is not set", () => {
    render(
      <PersonalDetailsCard details={{ phone: "0400 111 222", emergencyContactName: "Helen" }} />,
    );
    expect(card().queryByText("Age", { selector: "dt" })).toBeNull();
    expect(card().queryByText("Email", { selector: "dt" })).toBeNull();
    expect(card().queryByText("Address", { selector: "dt" })).toBeNull();
    expect(valueOf("Emergency contact")).toBe("Helen");
  });

  it("[F0-28][AC-11] with nothing set it says so; family also sees where to add them", () => {
    const { unmount } = render(<PersonalDetailsCard details={{}} />);
    expect(card().getByText("No personal details added yet.")).toBeInTheDocument();
    expect(card().queryByRole("link")).toBeNull();
    unmount();

    render(<PersonalDetailsCard details={{}} settingsHref="/family/client-margaret/settings" />);
    expect(card().getByRole("link", { name: "Add them in Settings" })).toHaveAttribute(
      "href",
      "/family/client-margaret/settings",
    );
  });

  it("[F0-28][AC-12] has no edit control, whatever the viewer", () => {
    render(<PersonalDetailsCard details={FULL} settingsHref="/family/x/settings" />);
    expect(card().queryByRole("button")).toBeNull();
    expect(card().queryByRole("textbox")).toBeNull();
  });

  it("[F0-28][AC-16] is axe clean, full and empty", async () => {
    const { container, rerender } = render(<PersonalDetailsCard details={FULL} />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<PersonalDetailsCard details={{}} settingsHref="/family/x/settings" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("[F0-28] Client Details views", () => {
  it("[F0-28][AC-11] Family (and Admin) Client Details shows the card first", () => {
    render(
      <FamilyInfoView
        clientId="client-margaret"
        data={EMPTY_INFO}
        personalDetails={FULL}
        canEdit
      />,
    );
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings[0]).toBe("Personal details");
    expect(valueOf("Phone")).toBe("0400 111 222");
  });

  it("[F0-28][AC-12] Carer Client Details shows the same card read-only", () => {
    render(
      <CarerInfoView
        clientId="client-margaret"
        data={EMPTY_INFO}
        personalDetails={FULL}
        canEdit={false}
      />,
    );
    expect(valueOf("Phone")).toBe("0400 111 222");
    expect(card().queryByRole("button")).toBeNull();
  });

  it("[F0-28][AC-11] with no personalDetails passed, the views render as before", () => {
    render(<FamilyInfoView clientId="client-margaret" data={EMPTY_INFO} canEdit={false} />);
    expect(screen.queryByRole("region", { name: "Personal details" })).toBeNull();
  });
});
