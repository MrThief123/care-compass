import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import ClientsError from "@/app/(admin)/admin/clients/error";
import ClientsLoading from "@/app/(admin)/admin/clients/loading";

it("[ADM-UI-04][AC-01] announces loading clients", () => {
  render(<ClientsLoading />);
  expect(screen.getByRole("status", { name: "Loading clients" })).toBeVisible();
});
it("[ADM-UI-04][AC-01] retries a failed client request", async () => {
  const retry = vi.fn();
  render(<ClientsError error={new Error("Synthetic failure")} retry={retry} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Unable to load clients");
  await userEvent.click(screen.getByRole("button", { name: /retry|try again/i }));
  expect(retry).toHaveBeenCalledOnce();
});
