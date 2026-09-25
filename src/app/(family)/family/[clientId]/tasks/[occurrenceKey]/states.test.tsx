import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ clientId: "client-margaret" }),
}));

import TaskDetailLoading from "./loading";
import TaskNotFound from "./not-found";

describe("[FAM-UI-07] Task detail route states", () => {
  it("[FAM-UI-07][PRD] the loading state shows a labelled skeleton for the detail cards, not data", () => {
    render(<TaskDetailLoading />);

    expect(screen.getAllByRole("status", { name: "Loading" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });

  it("[FAM-UI-07][PRD] the not-found state explains the task can't be found and links back to the Task log", () => {
    render(<TaskNotFound />);

    expect(screen.getByText("Task not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Task log" })).toHaveAttribute(
      "href",
      "/family/client-margaret/tasks",
    );
  });

  it("[FAM-UI-07][PRD] the loading and not-found states have no axe violations", async () => {
    const loading = render(<TaskDetailLoading />);
    expect(await axe(loading.container)).toHaveNoViolations();
    loading.unmount();

    const notFound = render(<TaskNotFound />);
    expect(await axe(notFound.container)).toHaveNoViolations();
  });
});
