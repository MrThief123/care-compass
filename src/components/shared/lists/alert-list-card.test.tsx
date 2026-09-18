import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertListCard } from "./alert-list-card";

describe("AlertListCard", () => {
  it("[UI-03][AC-02] shows the count badge and an 'Overdue' pill on every row", () => {
    render(
      <AlertListCard
        title="Overdue"
        count={3}
        rows={[
          { key: "1", title: "Wound dressing check", date: "Fri 27 Nov" },
          { key: "2", title: "Medication review", date: "Sat 28 Nov" },
          { key: "3", title: "Weekly weigh-in", date: "Sun 29 Nov" },
        ]}
      />,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
    const rows = within(screen.getByRole("list"));
    expect(rows.getAllByText("Overdue")).toHaveLength(3);
  });
});
