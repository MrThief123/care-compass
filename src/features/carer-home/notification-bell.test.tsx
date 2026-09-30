import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationBell } from "./notification-bell";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  pathname: vi.fn(() => "/carer/home"),
  markCarerNotificationsRead: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  usePathname: () => mocks.pathname(),
}));
vi.mock("@/server/notifications/actions", () => ({
  markCarerNotificationsRead: mocks.markCarerNotificationsRead,
}));

/*
 * The bell is a Lane C client component handed to the shared PageHeader's
 * `bellSlot` (FD-05). Its target is the Notifications heading on Carer Home,
 * `id="carer-home-notifications"` (FD-04); the test stands one in the document.
 */
const scrollIntoView = vi.fn();

function renderWithCard(unreadCount: number) {
  return render(
    <>
      <NotificationBell unreadCount={unreadCount} />
      <h2 id="carer-home-notifications" tabIndex={-1}>
        Notifications
      </h2>
    </>,
  );
}

beforeEach(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
  mocks.pathname.mockReturnValue("/carer/home");
  mocks.markCarerNotificationsRead.mockResolvedValue({ ok: true, data: undefined });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("[CAR-02][AC-07] the bell's unread count", () => {
  it("[CAR-02][AC-07] two unread: the name is 'Notifications, 2 unread' and the count '2' shows", () => {
    renderWithCard(2);

    const bell = screen.getByRole("button", { name: "Notifications, 2 unread" });
    expect(bell).toHaveTextContent("2");
  });

  it("[CAR-02][AC-07] none unread: the name is 'Notifications' and no count shows", () => {
    renderWithCard(0);

    const bell = screen.getByRole("button", { name: "Notifications" });
    expect(bell).not.toHaveTextContent(/\d/);
  });

  it("[CAR-02][AC-07] ten or more unread shows '9+'", () => {
    renderWithCard(12);

    const bell = screen.getByRole("button", { name: "Notifications, 12 unread" });
    expect(bell).toHaveTextContent("9+");
  });
});

describe("[CAR-02][AC-08] the bell on Carer Home", () => {
  it("[CAR-02][AC-08] click marks all read, scrolls to the card, focuses it and refreshes", async () => {
    const user = userEvent.setup();
    renderWithCard(2);

    await user.click(screen.getByRole("button", { name: "Notifications, 2 unread" }));

    await waitFor(() => expect(mocks.markCarerNotificationsRead).toHaveBeenCalledTimes(1));
    expect(scrollIntoView).toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Notifications" })).toHaveFocus();
    expect(mocks.refresh).toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

describe("[CAR-02][AC-09] the bell on another carer page", () => {
  it("[CAR-02][AC-09] click marks all read then goes to /carer/home#carer-home-notifications", async () => {
    mocks.pathname.mockReturnValue("/carer/patients");
    const user = userEvent.setup();
    render(<NotificationBell unreadCount={2} />);

    await user.click(screen.getByRole("button", { name: "Notifications, 2 unread" }));

    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/carer/home#carer-home-notifications"),
    );
    expect(mocks.markCarerNotificationsRead).toHaveBeenCalledTimes(1);
    // The layout persists across navigations, so the count is refreshed too.
    expect(mocks.refresh).toHaveBeenCalled();
  });
});

describe("[CAR-02][AC-11] a failed mark-read", () => {
  it.each([
    [
      "returns an error result",
      () =>
        Promise.resolve({
          ok: false,
          error: { code: "UNEXPECTED", message: "Aisha Rahman, Margaret Doyle" },
        }),
    ],
    ["rejects", () => Promise.reject(new Error("Aisha Rahman, Margaret Doyle"))],
  ])(
    "[CAR-02][AC-11] when the action %s: the card still scrolls, the count stays, no names appear",
    async (_label, fail) => {
      mocks.markCarerNotificationsRead.mockImplementation(fail);
      const user = userEvent.setup();
      vi.spyOn(console, "error").mockImplementation(() => {});
      renderWithCard(2);

      await user.click(screen.getByRole("button", { name: "Notifications, 2 unread" }));

      await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
      expect(screen.getByRole("button", { name: "Notifications, 2 unread" })).toBeInTheDocument();
      expect(document.body).not.toHaveTextContent(/Aisha|Margaret/);
    },
  );
});

describe("[CAR-02][AC-12] accessibility", () => {
  it("[CAR-02][AC-12] has no axe violations, with and without a count", async () => {
    const withCount = renderWithCard(2);
    expect(await axe(withCount.container)).toHaveNoViolations();
    withCount.unmount();

    const none = renderWithCard(0);
    expect(await axe(none.container)).toHaveNoViolations();
  });

  it.each(["{Enter}", " "])("[CAR-02][AC-12] activates from the keyboard with %j", async (key) => {
    const user = userEvent.setup();
    renderWithCard(2);

    await user.tab();
    expect(screen.getByRole("button", { name: "Notifications, 2 unread" })).toHaveFocus();
    await user.keyboard(key);

    await waitFor(() => expect(mocks.markCarerNotificationsRead).toHaveBeenCalledTimes(1));
  });

  it("[CAR-02][AC-12] the bell is at least 44×44px", () => {
    renderWithCard(2);

    const bell = screen.getByRole("button", { name: "Notifications, 2 unread" });
    // jsdom has no layout: the target size is set by classes (min-h-11 / min-w-11 = 44px).
    expect(bell.className).toMatch(/min-h-11|h-11/);
    expect(bell.className).toMatch(/min-w-11|w-11/);
  });
});
