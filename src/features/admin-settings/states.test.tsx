import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import AdminLayout from "@/app/(admin)/admin/layout";
import SettingsError from "@/app/(admin)/admin/settings/error";
import SettingsLoading from "@/app/(admin)/admin/settings/loading";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/settings" }));
vi.mock("@/server/auth/queries", () => ({
  getCurrentUser: vi.fn(async () => ({ firstName: "Priya", lastName: "Iyer" })),
}));
vi.mock("@/components/shared/sign-out-button", () => ({
  SignOutButton: () => <button>Sign out</button>,
}));

it("[ADM-UI-05][AC-02] actual Admin header has no notification bell", async () => {
  render(await AdminLayout({ children: <p>Settings content</p> }));
  expect(screen.getByRole("banner")).toHaveTextContent("Priya Iyer");
  expect(screen.queryByRole("button", { name: /notification|bell/i })).not.toBeInTheDocument();
});
it("[ADM-UI-05][AC-01] announces settings loading", () => {
  render(<SettingsLoading />);
  expect(screen.getByRole("status", { name: "Loading settings" })).toBeVisible();
});
it("[ADM-UI-05][AC-01] offers retry after load failure", async () => {
  const retry = vi.fn();
  render(<SettingsError error={new Error("Synthetic failure")} retry={retry} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Unable to load settings");
  await userEvent.click(screen.getByRole("button", { name: /retry|try again/i }));
  expect(retry).toHaveBeenCalledOnce();
});
