import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { BudgetHolder } from "@/features/family-budget/budget-holder";
import { FamilyBudgetView } from "@/features/family-budget/family-budget-view";
import { CalendarToolbar } from "@/features/family-calendar/calendar-toolbar";
import { EnterEventLink } from "@/features/family-home/enter-event-link";
import type { BudgetBucketSummary, FundEntry } from "@/types/domain";

import { HELP_TEXT } from "./help-text";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const BUCKET: BudgetBucketSummary = {
  id: "bucket-1",
  clientId: "client-margaret",
  kind: "ndis",
  label: "NDIS",
  total: 1000,
  used: 100,
  remaining: 900,
  percentUsed: 10,
  state: "ok",
} as BudgetBucketSummary;

const ENTRY: FundEntry = {
  id: "entry-1",
  clientId: "client-margaret",
  bucketId: "bucket-1",
  type: "topup",
  amount: 1000,
  date: "2026-11-01",
  description: "Opening funds",
};

function budget(showHelp?: boolean, history: FundEntry[] = [ENTRY]) {
  return render(
    <BudgetHolder>
      <FamilyBudgetView
        clientId="client-margaret"
        data={{ buckets: [BUCKET], history, today: "2026-11-30" }}
        showHelp={showHelp}
      />
    </BudgetHolder>,
  );
}

function toolbar(props: { showHelp?: boolean; enterEventHref?: string }) {
  return render(
    <CalendarToolbar
      label="Week"
      view="week"
      onViewChange={() => {}}
      onStep={() => {}}
      onToday={() => {}}
      {...props}
    />,
  );
}

describe("Family info tips", () => {
  it("[FAM-17][AC-07] Home 'Enter event' has a tip with its help text", async () => {
    const user = userEvent.setup();
    render(<EnterEventLink clientId="client-margaret" showHelp />);

    await user.click(screen.getByRole("button", { name: "About Enter event" }));

    expect(screen.getByRole("tooltip")).toHaveTextContent(HELP_TEXT.enterEvent.text);
  });

  it("[FAM-17][AC-07] the Calendar toolbar's 'Enter event' has a tip with its help text", async () => {
    const user = userEvent.setup();
    toolbar({ showHelp: true, enterEventHref: "/family/client-margaret/events/new" });

    await user.click(screen.getByRole("button", { name: "About Enter event" }));

    expect(screen.getByRole("tooltip")).toHaveTextContent(HELP_TEXT.enterEvent.text);
  });

  it("[FAM-17][AC-08] Budget 'Edit' and History 'Export' each have a tip with their help text", async () => {
    const user = userEvent.setup();
    budget(true);

    await user.click(screen.getByRole("button", { name: "About Edit" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(HELP_TEXT.editBudget.text);

    await user.click(screen.getByRole("button", { name: "About Export" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(HELP_TEXT.exportHistory.text);
    expect(screen.getAllByRole("tooltip")).toHaveLength(1);
  });

  it("[FAM-17][AC-08] no 'Export' tip while there is no history to export", () => {
    budget(true, []);

    expect(screen.getByRole("button", { name: "About Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "About Export" })).not.toBeInTheDocument();
  });

  it("[FAM-17][AC-09] the page has no axe violations with a tip open", async () => {
    const user = userEvent.setup();
    const { container } = budget(true);

    await user.click(screen.getByRole("button", { name: "About Edit" }));

    expect(await axe(container)).toHaveNoViolations();
  });

  it("[FAM-17][AC-10] Carer and Admin screens, which do not ask for help, draw no tips", () => {
    render(<EnterEventLink clientId="client-margaret" />);
    toolbar({ enterEventHref: "/x" });
    budget(undefined);

    expect(screen.queryByRole("button", { name: /^About / })).not.toBeInTheDocument();
  });
});
