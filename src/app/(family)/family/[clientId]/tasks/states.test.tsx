import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import TasksError from "./error";
import TasksLoading from "./loading";

describe("[FAM-UI-07] Task log route states", () => {
  it("[FAM-UI-07][PRD] the loading state shows the title with a labelled skeleton, not data", () => {
    render(<TasksLoading />);

    expect(screen.getByRole("heading", { level: 1, name: "Task log" })).toBeInTheDocument();
    expect(screen.getAllByRole("status", { name: "Loading" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] the error state says 'Something went wrong' and Retry calls the boundary's retry", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    render(<TasksError error={new Error("boom")} retry={retry} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("[FAM-UI-07][PRD] the loading and error states have no axe violations", async () => {
    const loading = render(<TasksLoading />);
    expect(await axe(loading.container)).toHaveNoViolations();
    loading.unmount();

    const error = render(<TasksError error={new Error("boom")} retry={() => {}} />);
    expect(await axe(error.container)).toHaveNoViolations();
  });
});
