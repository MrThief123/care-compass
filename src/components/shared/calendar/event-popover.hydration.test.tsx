import { act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import type { Occurrence } from "@/types/domain";

import { EventPopover } from "./event-popover";

/**
 * A page that renders the card from the start (the showcase at `/`) must
 * hydrate cleanly: the server has no `document.body` to portal into, so the
 * first client render must match the server's empty output, and the card
 * appears once hydration is done.
 */

const OCCURRENCE: Occurrence = {
  key: "showcase-event",
  eventId: "showcase-event",
  clientId: "client-margaret",
  title: "Client Support Meeting",
  description: "Example calendar event.",
  start: "2026-09-18T09:00:00+10:00",
  durationMinutes: 60,
  status: "planned",
  assignee: "Sarah Johnson",
};

let cleanup: (() => void) | undefined;
afterEach(() => {
  cleanup?.();
  cleanup = undefined;
});

describe("[UI-05] EventPopover hydration", () => {
  it("[UI-05] hydrates without a mismatch and shows the card afterwards", async () => {
    const element = <EventPopover occurrence={OCCURRENCE} anchor={null} onClose={() => {}} />;
    const container = document.createElement("div");
    document.body.append(container);
    // What the server sends: no document there, so the card is not in the HTML.
    const serverHtml = renderToString(element);
    expect(serverHtml).not.toContain("Client Support Meeting");
    container.innerHTML = serverHtml;

    const errors: unknown[] = [];
    await act(async () => {
      const root = hydrateRoot(container, element, {
        onRecoverableError: (error) => errors.push(error),
      });
      cleanup = () => {
        root.unmount();
        container.remove();
      };
    });

    expect(errors).toEqual([]);
    expect(document.body.querySelector('[role="tooltip"]')).toHaveTextContent(
      "Client Support Meeting",
    );
  });
});
