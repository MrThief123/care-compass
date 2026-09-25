import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ clientId: "client-margaret" }),
}));

import EditEventNotFound from "./[eventId]/edit/not-found";
import EventFormError from "./error";
import EventFormLoading from "./loading";

describe("[FAM-UI-03] Add / Edit event route states", () => {
  it("[FAM-UI-03][PRD] the loading state shows a labelled skeleton, not a form", () => {
    render(<EventFormLoading />);

    expect(screen.getAllByRole("status", { name: "Loading" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Save event" })).not.toBeInTheDocument();
  });

  it("[FAM-UI-03][PRD] the error state offers a retry that re-fetches the segment", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    render(<EventFormError error={new Error("boom")} retry={retry} />);

    expect(screen.queryByText("boom")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /try again|retry/i }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("[FAM-UI-03][PRD] the not-found state explains the event can't be found and links to the Calendar", () => {
    render(<EditEventNotFound />);

    expect(screen.getByText("Event not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Calendar" })).toHaveAttribute(
      "href",
      "/family/client-margaret/calendar",
    );
  });

  it("[FAM-UI-03][PRD] the loading, error and not-found states have no axe violations", async () => {
    for (const ui of [
      <EventFormLoading key="loading" />,
      <EventFormError key="error" error={new Error("x")} retry={() => {}} />,
      <EditEventNotFound key="not-found" />,
    ]) {
      const view = render(ui);
      expect(await axe(view.container)).toHaveNoViolations();
      view.unmount();
    }
  });
});
