import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { editEventDetailsValues } from "@/features/family-event-form/event-details";
import { EventFormScreen } from "@/features/family-event-form/event-form-screen";
import {
  EMPTY_EVENT_VALUES,
  editEventValues,
  isTaskEvent,
} from "@/features/family-event-form/event-form-values";
import { getBudgetSummary } from "@/server/budget/queries";
import { getEvent } from "@/server/events/queries";
import type { BudgetBucketSummary } from "@/types/domain";

/*
 * [F0-29] Tags on Add event and Edit event. Shown only when the page passes the client's tags
 * (Family); sent to createEvent / updateEvent as `tags`. The actions are mocked to assert the payload.
 */
const mocks = vi.hoisted(() => ({ push: vi.fn(), createEvent: vi.fn(), updateEvent: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
}));
vi.mock("@/server/events/actions", () => ({
  createEvent: mocks.createEvent,
  updateEvent: mocks.updateEvent,
}));

const CLIENT_ID = "client-margaret";
const TAGS = ["Doctors", "Medication", "Therapy"];
let buckets: BudgetBucketSummary[];

beforeEach(async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  buckets = await getBudgetSummary(CLIENT_ID);
  mocks.createEvent.mockResolvedValue({ ok: true, data: { eventId: "event-new" } });
  mocks.updateEvent.mockResolvedValue({ ok: true, data: { eventId: "event-x" } });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

function renderAdd(tagOptions?: string[]) {
  return render(
    <EventFormScreen
      mode="add"
      clientId={CLIENT_ID}
      initialValues={{ ...EMPTY_EVENT_VALUES, date: "2026-11-30" }}
      initialIsTask
      buckets={buckets}
      month="2026-11-30"
      documents={[]}
      returnHref="/family/client-margaret/home"
      {...(tagOptions ? { tagOptions } : {})}
    />,
  );
}

async function renderEdit(initialTags?: string[]) {
  const event = (await getEvent(CLIENT_ID, "event-margaret-med-review"))!;
  return render(
    <EventFormScreen
      mode="edit"
      clientId={CLIENT_ID}
      eventId={event.id}
      occurrenceOriginalStart={event.start}
      initialValues={editEventValues(event)}
      initialIsTask={isTaskEvent(event)}
      initialDetails={editEventDetailsValues(event)}
      buckets={buckets}
      month="2026-09-05"
      documents={[]}
      returnHref="/family/client-margaret/tasks"
      {...(initialTags ? { tagOptions: TAGS, initialTags } : {})}
    />,
  );
}

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Title"), "GP visit");
  await user.clear(screen.getByLabelText("Start time"));
  await user.type(screen.getByLabelText("Start time"), "09:30");
}

describe("[F0-29] Tags on Add event", () => {
  it("[F0-29][AC-01] lists the client's tags and sends the chosen and new ones", async () => {
    const user = userEvent.setup();
    renderAdd(TAGS);
    await fill(user);
    expect(screen.getByRole("group", { name: "Tags" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Doctors" }));
    await user.type(screen.getByLabelText("New tag"), "Dentist{Enter}");
    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(mocks.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ["Doctors", "Dentist"] }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/family/client-margaret/home");
  });

  it("[F0-29][AC-04] without the client's tags (a carer's form) there is no Tags field and no `tags`", async () => {
    const user = userEvent.setup();
    renderAdd();
    await fill(user);
    expect(screen.queryByRole("group", { name: "Tags" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save event" }));
    expect(mocks.createEvent.mock.calls[0]![0]).not.toHaveProperty("tags");
  });

  it("[F0-29][AC-06] shows the action's message when the tags were not saved", async () => {
    const user = userEvent.setup();
    mocks.createEvent.mockResolvedValue({
      ok: false,
      error: {
        code: "UNEXPECTED",
        message: "The event was saved, but its tags weren't. Open the event and add them again.",
      },
    });
    renderAdd(TAGS);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Doctors" }));
    await user.click(screen.getByRole("button", { name: "Save event" }));
    expect(screen.getByRole("status", { name: "Save error" })).toHaveTextContent(
      "The event was saved, but its tags weren't. Open the event and add them again.",
    );
  });
});

describe("[F0-29] Tags on Edit event", () => {
  it("[F0-29][AC-02] opens with the event's tags chosen; unchoosing one sends the rest", async () => {
    const user = userEvent.setup();
    await renderEdit(["Doctors", "Medication"]);
    expect(screen.getByRole("button", { name: "Doctors" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Therapy" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await user.click(screen.getByRole("button", { name: "Doctors" }));
    await user.click(screen.getByRole("button", { name: "Save event" }));
    expect(mocks.updateEvent).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ["Medication"] }),
    );
  });

  it("[F0-29][AC-04] a carer's Edit event sends no `tags`, so they stay", async () => {
    const user = userEvent.setup();
    await renderEdit();
    await user.click(screen.getByRole("button", { name: "Save event" }));
    expect(mocks.updateEvent.mock.calls[0]![0]).not.toHaveProperty("tags");
  });
});
