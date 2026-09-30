import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * F0-22 AC-08: with the real mock contract (DATA_SOURCE=mock) the family layout behaves as it
 * did before the guard was added: no redirect, the mock client's header.
 */
// The Supabase client is built from env vars a mock-mode test does not set; it is never called here.
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/components/shared/rail", () => ({ Rail: () => <nav aria-label="Rail" /> }));
vi.mock("@/components/shared/sign-out-button", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

import FamilyLayout from "./layout";

const MARGARET_CLIENT_ID = "client-margaret";

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("[F0-22][AC-08] the family layout under DATA_SOURCE=mock", () => {
  it("[F0-22][AC-08] renders Margaret's header and the page without redirecting", async () => {
    render(
      await FamilyLayout({
        children: <p>Page body</p>,
        params: Promise.resolve({ clientId: MARGARET_CLIENT_ID }),
      }),
    );

    expect(screen.getByText("Margaret")).toBeInTheDocument();
    expect(screen.getByText(/years/)).toBeInTheDocument();
    expect(screen.getByText("Page body")).toBeInTheDocument();
  });
});
