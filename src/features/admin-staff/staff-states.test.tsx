import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import StaffError from "@/app/(admin)/admin/staff/error";
import StaffLoading from "@/app/(admin)/admin/staff/loading";

it("[ADM-UI-03][AC-01] announces the loading state", () => {
  render(<StaffLoading />);
  expect(screen.getByRole("status", { name: "Loading staff" })).toBeVisible();
});
it("[ADM-UI-03][AC-01] retries a failed staff query", async () => {
  const retry = vi.fn();
  render(<StaffError error={new Error("test")} retry={retry} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Unable to load staff");
  await userEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(retry).toHaveBeenCalledOnce();
});
