import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EventFormScreen } from "@/features/family-event-form/event-form-screen";
import { EMPTY_EVENT_VALUES } from "@/features/family-event-form/event-form-values";
import { getBudgetSummary } from "@/server/budget/queries";
import type { BudgetBucketSummary } from "@/types/domain";

/*
 * F0-23 T-04: files chosen on Add event are uploaded with no event id, then linked to the
 * event once `createEvent` returns one. The actions are mocked directly (as event-form-add.test.tsx
 * and event-documents.test.tsx do); the real round trip is T-05.
 */
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  createEvent: vi.fn(),
  uploadDocument: vi.fn(),
  getDocumentUrl: vi.fn(),
  linkDocumentsToEvent: vi.fn(),
  order: [] as string[],
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
}));
vi.mock("@/server/events/actions", () => ({
  createEvent: mocks.createEvent,
  updateEvent: vi.fn(),
}));
vi.mock("@/server/documents/actions", () => ({
  uploadDocument: mocks.uploadDocument,
  getDocumentUrl: mocks.getDocumentUrl,
  linkDocumentsToEvent: mocks.linkDocumentsToEvent,
}));

const CLIENT_ID = "client-margaret";
const RETURN_HREF = "/family/client-margaret/home";

let buckets: BudgetBucketSummary[];

beforeEach(async () => {
  vi.stubEnv("DATA_SOURCE", "mock");
  buckets = await getBudgetSummary(CLIENT_ID);
  mocks.order.length = 0;
  mocks.createEvent.mockImplementation(async () => {
    mocks.order.push("createEvent");
    return { ok: true, data: { eventId: "event-new" } };
  });
  mocks.uploadDocument.mockImplementation(async (form: FormData) => {
    const name = (form.get("file") as File).name;
    return { ok: true, data: { documentId: `doc-${name}`, storagePath: `clients/x/${name}` } };
  });
  mocks.linkDocumentsToEvent.mockImplementation(async () => {
    mocks.order.push("linkDocumentsToEvent");
    return { ok: true, data: { failedIds: [] } };
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

function renderAdd() {
  return render(
    <EventFormScreen
      mode="add"
      clientId={CLIENT_ID}
      initialValues={{ ...EMPTY_EVENT_VALUES, date: "2026-11-30" }}
      initialIsTask
      buckets={buckets}
      month="2026-11-30"
      documents={[]}
      returnHref={RETURN_HREF}
    />,
  );
}

function file(name: string) {
  return new File(["%PDF-1.4"], name, { type: "application/pdf" });
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Title"), "Physiotherapy");
  await user.clear(screen.getByLabelText("Start time"));
  await user.type(screen.getByLabelText("Start time"), "09:30");
}

describe("[F0-23] Add event links its uploaded files on save", () => {
  it("[F0-23][AC-08] T-04 '+ Add file' opens the picker on Add event: the file uploads with the client id and no event id, its tile appears, and there is no 'Save the event first' message", async () => {
    const user = userEvent.setup();
    renderAdd();

    await user.upload(screen.getByLabelText("Choose a file to add"), file("Physio referral.pdf"));

    expect(mocks.uploadDocument).toHaveBeenCalledTimes(1);
    const form = mocks.uploadDocument.mock.calls[0]?.[0] as FormData;
    expect(form.get("clientId")).toBe(CLIENT_ID);
    expect(form.get("eventId")).toBeNull();
    expect(await screen.findByText("Physio referral.pdf")).toBeInTheDocument();
    expect(screen.queryByText(/save the event first/i)).not.toBeInTheDocument();
  });

  it("[F0-23][AC-08] T-04 the Add file tile does not show the old explanation when clicked", async () => {
    const user = userEvent.setup();
    renderAdd();

    await user.click(screen.getByRole("button", { name: /add file/i }));

    expect(screen.queryByText(/save the event first/i)).not.toBeInTheDocument();
  });

  it("[F0-23][AC-06] T-04 Save event runs createEvent, then linkDocumentsToEvent with the new event id and both document ids, then leaves the form", async () => {
    const user = userEvent.setup();
    renderAdd();
    await fillRequired(user);
    await user.upload(screen.getByLabelText("Choose a file to add"), file("Physio referral.pdf"));
    await screen.findByText("Physio referral.pdf");
    await user.upload(screen.getByLabelText("Choose a file to add"), file("Care plan.pdf"));
    await screen.findByText("Care plan.pdf");

    await user.click(screen.getByRole("button", { name: "Save event" }));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(RETURN_HREF));
    expect(mocks.createEvent).toHaveBeenCalledTimes(1);
    expect(mocks.linkDocumentsToEvent).toHaveBeenCalledTimes(1);
    expect(mocks.linkDocumentsToEvent).toHaveBeenCalledWith({
      eventId: "event-new",
      documentIds: ["doc-Physio referral.pdf", "doc-Care plan.pdf"],
    });
    expect(mocks.order).toEqual(["createEvent", "linkDocumentsToEvent"]);
  });

  it("[F0-23][AC-06] T-04 with no files chosen, Save event does not call linkDocumentsToEvent", async () => {
    const user = userEvent.setup();
    renderAdd();
    await fillRequired(user);

    await user.click(screen.getByRole("button", { name: "Save event" }));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(RETURN_HREF));
    expect(mocks.linkDocumentsToEvent).not.toHaveBeenCalled();
  });

  it("[F0-23][AC-06] T-04 a refused upload adds no document id to the link call", async () => {
    mocks.uploadDocument.mockResolvedValueOnce({
      ok: false,
      error: { code: "VALIDATION", message: "That file is too large." },
    });
    const user = userEvent.setup();
    renderAdd();
    await fillRequired(user);
    await user.upload(screen.getByLabelText("Choose a file to add"), file("Huge.pdf"));
    expect(await screen.findByText("That file is too large.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save event" }));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(RETURN_HREF));
    expect(mocks.linkDocumentsToEvent).not.toHaveBeenCalled();
  });

  it("[F0-23][AC-06] T-04 when createEvent fails, nothing is linked and the form stays", async () => {
    mocks.createEvent.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't save. Please try again." },
    });
    const user = userEvent.setup();
    renderAdd();
    await fillRequired(user);
    await user.upload(screen.getByLabelText("Choose a file to add"), file("Physio referral.pdf"));
    await screen.findByText("Physio referral.pdf");

    await user.click(screen.getByRole("button", { name: "Save event" }));

    expect(await screen.findByText("Couldn't save. Please try again.")).toBeInTheDocument();
    expect(mocks.linkDocumentsToEvent).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("[F0-23][AC-07] T-04 when one file fails to link, the event is kept, the notice names the file, and a Continue link goes to the return page; Save cannot create the event twice", async () => {
    mocks.linkDocumentsToEvent.mockResolvedValue({
      ok: true,
      data: { failedIds: ["doc-Care plan.pdf"] },
    });
    const user = userEvent.setup();
    renderAdd();
    await fillRequired(user);
    await user.upload(screen.getByLabelText("Choose a file to add"), file("Physio referral.pdf"));
    await screen.findByText("Physio referral.pdf");
    await user.upload(screen.getByLabelText("Choose a file to add"), file("Care plan.pdf"));
    await screen.findByText("Care plan.pdf");

    await user.click(screen.getByRole("button", { name: "Save event" }));

    const notice = await screen.findByRole("alert");
    expect(notice).toHaveTextContent(/Care plan\.pdf/);
    expect(notice).toHaveTextContent(/event was saved/i);
    expect(notice).toHaveTextContent(/Edit event/i);
    expect(notice).not.toHaveTextContent(/Physio referral\.pdf/);
    expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute("href", RETURN_HREF);
    expect(mocks.push).not.toHaveBeenCalled();

    expect(screen.queryByRole("button", { name: "Save event" })).not.toBeInTheDocument();
    expect(mocks.createEvent).toHaveBeenCalledTimes(1);
  });

  it("[F0-23][AC-07] T-04 when the link action itself fails, every file is named and the event is kept", async () => {
    mocks.linkDocumentsToEvent.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't attach files." },
    });
    const user = userEvent.setup();
    renderAdd();
    await fillRequired(user);
    await user.upload(screen.getByLabelText("Choose a file to add"), file("Physio referral.pdf"));
    await screen.findByText("Physio referral.pdf");

    await user.click(screen.getByRole("button", { name: "Save event" }));

    const notice = await screen.findByRole("alert");
    expect(notice).toHaveTextContent(/Physio referral\.pdf/);
    expect(notice).toHaveTextContent(/event was saved/i);
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
