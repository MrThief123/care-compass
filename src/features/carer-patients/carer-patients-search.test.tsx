import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PatientsPage from "@/app/(carer)/carer/patients/page";
import type { CarerPatientRow } from "@/server/shifts/queries";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  getCurrentUser: vi.fn(),
  getCarerPatients: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: mocks.replace, refresh: vi.fn() }),
  usePathname: () => "/carer/patients",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/server/auth/queries", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/shifts/queries", () => ({ getCarerPatients: mocks.getCarerPatients }));

/*
 * [CAR-03] Server-side search (FD-01): the URL's `?q=` is the search. The page reads it and asks
 * `getCarerPatients(carerId, q)`; the view shows what it is given and moves the URL, as Family's
 * Care log does. Debounce length is the implementer's, so these tests advance fake timers past 1s.
 */
const CARER_ID = "staff-aisha";

const ELSIE: CarerPatientRow = {
  clientId: "client-elsie",
  firstName: "Elsie",
  name: "Elsie Marsh",
  age: 90,
  suburb: "Thornbury VIC",
  onShift: false,
};
const MARGARET: CarerPatientRow = {
  clientId: "client-margaret",
  firstName: "Margaret",
  name: "Margaret Doyle",
  age: 78,
  suburb: "Preston VIC",
  onShift: true,
};

beforeEach(() => {
  mocks.getCurrentUser.mockResolvedValue({ profileId: CARER_ID, role: "carer" });
  mocks.getCarerPatients.mockResolvedValue([MARGARET, ELSIE]);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

async function renderPatients(q?: string | string[]) {
  const searchParams = Promise.resolve(q === undefined ? {} : { q });
  return render(await PatientsPage({ searchParams }));
}

function cardLinks() {
  return screen
    .queryAllByRole("link")
    .filter((link) => link.getAttribute("href")?.startsWith("/carer/patients/"));
}

describe("[CAR-03][AC-02] search is the URL's ?q=", () => {
  it("[CAR-03][AC-02] ?q=Els asks the contract for 'Els' and shows only what it returns", async () => {
    mocks.getCarerPatients.mockResolvedValue([ELSIE]);
    await renderPatients("Els");

    expect(mocks.getCarerPatients).toHaveBeenCalledWith(CARER_ID, "Els");
    expect(cardLinks().map((link) => link.getAttribute("href"))).toEqual([
      "/carer/patients/client-elsie",
    ]);
    expect(screen.getByText("Elsie Marsh")).toBeInTheDocument();
    expect(screen.queryByText("Margaret Doyle")).not.toBeInTheDocument();
  });

  it("[CAR-03][AC-02] the search box opens holding the URL's q", async () => {
    mocks.getCarerPatients.mockResolvedValue([ELSIE]);
    await renderPatients("Els");

    expect(screen.getByPlaceholderText("Search patients")).toHaveValue("Els");
  });

  it("[CAR-03][AC-02] a missing, blank or padded q is cleaned before the query", async () => {
    await renderPatients();
    await renderPatients("   ");
    await renderPatients("  Els  ");

    expect(mocks.getCarerPatients.mock.calls.map(([, q]) => q)).toEqual(["", "", "Els"]);
  });

  it("[CAR-03][AC-02] a repeated ?q=a&q=b uses the first value", async () => {
    await renderPatients(["Els", "Mar"]);

    expect(mocks.getCarerPatients).toHaveBeenCalledWith(CARER_ID, "Els");
  });

  it("[CAR-03][AC-02] typing puts the search in the URL once the typing pauses", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderPatients();

    await user.type(screen.getByPlaceholderText("Search patients"), "Els");
    expect(mocks.replace).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(mocks.replace).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith("/carer/patients?q=Els", { scroll: false });
  });

  it("[CAR-03][AC-02] Enter in the box searches at once", async () => {
    const user = userEvent.setup();
    await renderPatients();

    await user.type(screen.getByPlaceholderText("Search patients"), "Els{Enter}");

    expect(mocks.replace).toHaveBeenCalledWith("/carer/patients?q=Els", { scroll: false });
  });

  it("[CAR-03][AC-02] clearing the box takes q out of the URL", async () => {
    const user = userEvent.setup();
    await renderPatients("Els");

    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(mocks.replace).toHaveBeenCalledWith("/carer/patients", { scroll: false });
  });
});

describe("[CAR-03][AC-06] search with no match", () => {
  it("[CAR-03][AC-06] shows no cards, names the query and keeps the search box", async () => {
    mocks.getCarerPatients.mockResolvedValue([]);
    await renderPatients("zz");

    expect(cardLinks()).toHaveLength(0);
    expect(screen.getByText('No matches for "zz".')).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search patients")).toBeInTheDocument();
    expect(screen.queryByText("No patients assigned yet")).not.toBeInTheDocument();
  });
});

describe("[CAR-03][AC-03] no patients at all", () => {
  it("[CAR-03][AC-03] with no q and no patients, shows the empty state and no search box", async () => {
    mocks.getCarerPatients.mockResolvedValue([]);
    await renderPatients();

    expect(screen.getByText("No patients assigned yet")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search patients")).not.toBeInTheDocument();
  });
});

describe("[CAR-03][AC-01] full names on the cards", () => {
  it("[CAR-03][AC-01] a card shows the full name and 'age years · suburb'", async () => {
    await renderPatients();

    const card = cardLinks()[0]!;
    expect(within(card).getByText("Margaret Doyle")).toBeInTheDocument();
    expect(within(card).getByText("78 years · Preston VIC")).toBeInTheDocument();
    expect(within(card).queryByText(/^Margaret$/)).not.toBeInTheDocument();
  });
});
