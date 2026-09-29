import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { ManageLoading, ManageError } from "./manage-states";
it("[ADM-UI-02][AC-01] announces loading without showing false selections", () => {
  render(<ManageLoading />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading Manage");
  expect(screen.queryByRole("option")).not.toBeInTheDocument();
});
it("[ADM-UI-02][AC-01] retries a failed query through the error boundary", async () => {
  const retry = vi.fn();
  render(<ManageError retry={retry} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Unable to load Manage");
  await userEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(retry).toHaveBeenCalledOnce();
});
