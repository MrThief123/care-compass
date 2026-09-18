import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EmptyState, ErrorState } from "./states";

describe("ErrorState", () => {
  it("[F0-14][AC-04] calls onRetry once when Retry is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("We couldn't load this page. Please try again.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("EmptyState", () => {
  it("renders a title and body", () => {
    render(<EmptyState title="All caught up" body="There are no overdue tasks right now." />);

    expect(screen.getByText("All caught up")).toBeInTheDocument();
    expect(screen.getByText("There are no overdue tasks right now.")).toBeInTheDocument();
  });
});
