import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * F0-20: the order the family layout runs its checks in (session/role, then client access, then
 * the header read) with the contract functions faked. The real mock contract is covered in
 * layout.mock.test.tsx and the real database in
 * tests/integration/shared-client-header-wiring.test.ts.
 */
const order: string[] = [];

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  assertClientAccess: vi.fn(),
  getClientHeaderSummary: vi.fn(),
}));

vi.mock("@/server/auth/queries", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/clients/queries", () => ({
  assertClientAccess: mocks.assertClientAccess,
  getClientHeaderSummary: mocks.getClientHeaderSummary,
}));
vi.mock("@/components/shared/rail", () => ({ Rail: () => <nav aria-label="Rail" /> }));
vi.mock("@/components/shared/sign-out-button", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

import FamilyLayout from "./layout";

const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";

const SUMMARY = {
  id: CLIENT_ID,
  firstName: "Margaret",
  lastName: "Whitfield",
  age: 83,
  suburb: "Brunswick",
  organisationName: "Banksia Home Care",
};

/** A redirect as Next throws it. */
function redirectError(to: string) {
  return Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT;replace;${to};307;` });
}

async function renderLayout() {
  render(
    await FamilyLayout({
      children: <p>Page body</p>,
      params: Promise.resolve({ clientId: CLIENT_ID }),
    }),
  );
}

beforeEach(() => {
  order.length = 0;
  mocks.getCurrentUser.mockReset().mockImplementation(async () => {
    order.push("getCurrentUser");
    return { profileId: "p1", role: "family", firstName: "Helen", lastName: "Doyle" };
  });
  mocks.assertClientAccess.mockReset().mockImplementation(async () => {
    order.push("assertClientAccess");
  });
  mocks.getClientHeaderSummary.mockReset().mockImplementation(async () => {
    order.push("getClientHeaderSummary");
    return SUMMARY;
  });
});

describe("[F0-20][AC-06] the family layout checks the session before any client data", () => {
  it("[F0-20][AC-06] runs the role check, then the client access check, then the header read, one after the other", async () => {
    await renderLayout();

    expect(order).toEqual(["getCurrentUser", "assertClientAccess", "getClientHeaderSummary"]);
    expect(mocks.getCurrentUser).toHaveBeenCalledWith("family");
    expect(mocks.assertClientAccess).toHaveBeenCalledWith(CLIENT_ID);
    expect(mocks.getClientHeaderSummary).toHaveBeenCalledWith(CLIENT_ID);
  });

  it("[F0-20][AC-06] a carer or admin redirected by the role check triggers no client read at all", async () => {
    mocks.getCurrentUser.mockRejectedValueOnce(redirectError("/carer/home"));

    await expect(renderLayout()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/carer/home;307;",
    });

    expect(mocks.assertClientAccess).not.toHaveBeenCalled();
    expect(mocks.getClientHeaderSummary).not.toHaveBeenCalled();
  });

  it("[F0-20][AC-06] a failing header read cannot hide the role redirect (F0-19 FD-05)", async () => {
    mocks.getCurrentUser.mockRejectedValueOnce(redirectError("/carer/home"));
    mocks.getClientHeaderSummary.mockRejectedValue(new Error("not implemented"));

    await expect(renderLayout()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/carer/home;307;",
    });
  });
});

describe("[F0-20][AC-05][AC-07] the family layout redirects a client the user cannot open", () => {
  it("[F0-20][AC-05] an unlinked client redirects and the header is never read", async () => {
    mocks.assertClientAccess.mockRejectedValueOnce(redirectError("/family/mine/home"));

    await expect(renderLayout()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/family/mine/home;307;",
    });

    expect(mocks.getClientHeaderSummary).not.toHaveBeenCalled();
  });

  it("[F0-20][AC-07] a family member with no client is sent to /no-client-linked", async () => {
    mocks.assertClientAccess.mockRejectedValueOnce(redirectError("/no-client-linked"));

    await expect(renderLayout()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/no-client-linked;307;",
    });
    expect(mocks.getClientHeaderSummary).not.toHaveBeenCalled();
  });
});

describe("[F0-20][AC-02] the header with missing details", () => {
  it("[F0-20][AC-01] shows the client's first name and the age, suburb and organisation line", async () => {
    await renderLayout();

    expect(screen.getByText("Margaret")).toBeInTheDocument();
    expect(screen.getByText("83 years · Brunswick · Banksia Home Care")).toBeInTheDocument();
    expect(screen.getByText("Page body")).toBeInTheDocument();
  });

  it("[F0-20][AC-02] leaves out the age, suburb and organisation when the summary has none", async () => {
    mocks.getClientHeaderSummary.mockResolvedValue({
      id: CLIENT_ID,
      firstName: "Margaret",
      lastName: "Whitfield",
    });

    await renderLayout();

    expect(screen.getByText("Margaret")).toBeInTheDocument();
    expect(screen.queryByText(/years/)).not.toBeInTheDocument();
    expect(screen.queryByText(/undefined|NaN/)).not.toBeInTheDocument();
  });

  it("[F0-20][AC-02] shows only the parts that exist, without stray separators", async () => {
    mocks.getClientHeaderSummary.mockResolvedValue({
      id: CLIENT_ID,
      firstName: "Margaret",
      lastName: "Whitfield",
      suburb: "Brunswick",
    });

    await renderLayout();

    expect(screen.getByText("Brunswick")).toBeInTheDocument();
  });
});
