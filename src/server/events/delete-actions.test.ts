// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * [F0-27] `deleteEvent` with the Supabase client faked. "This event" cancels one occurrence through an
 * override; "all future" caps the series with `recurrence_until` (or deactivates it when the viewed
 * occurrence is its first). Real RLS is covered by the existing care_events policies.
 */
const mocks = vi.hoisted(() => ({
  upsert: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  latestCompletion: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => ({
      select: () => {
        // care_events reads the event; care_event_completions reads the occurrence's latest action.
        const read = {
          eq: () => read,
          order: () => read,
          limit: () => read,
          maybeSingle:
            table === "care_event_completions" ? mocks.latestCompletion : mocks.maybeSingle,
        };
        return read;
      },
      upsert: (row: unknown, options: unknown) => mocks.upsert(table, row, options),
      update: (values: unknown) => {
        mocks.update(table, values);
        const chain = {
          eq: (...args: unknown[]) => {
            mocks.eq(...args);
            return chain;
          },
          select: () => chain,
          then: (resolve: (value: unknown) => void) =>
            resolve({ data: updateError ? null : [{ id: EVENT_ID }], error: updateError }),
        };
        return chain;
      },
    }),
  }),
}));

let updateError: { code: string } | null = null;

import { deleteEvent } from "./delete-actions";

const CLIENT_ID = "b1111111-1111-1111-1111-111111111111";
const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
// Weekly on Mondays at 10:00 Melbourne, first on 2026-10-05.
const FIRST = "2026-10-04T23:00:00.000Z";
const THIRD = "2026-10-18T23:00:00.000Z";

const base = { clientId: CLIENT_ID, eventId: EVENT_ID, occurrenceOriginalStart: THIRD };

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "supabase");
  updateError = null;
  mocks.upsert.mockResolvedValue({ error: null });
  mocks.maybeSingle.mockResolvedValue({
    data: { starts_at: FIRST, recurrence: { frequency: "weekly", interval: 1 } },
    error: null,
  });
  mocks.latestCompletion.mockResolvedValue({ data: null, error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("deleteEvent", () => {
  it("[F0-27][AC-05] 'occurrence' cancels only the viewed occurrence", async () => {
    const result = await deleteEvent({ ...base, scope: "occurrence" });
    expect(result.ok).toBe(true);
    expect(mocks.upsert).toHaveBeenCalledWith(
      "care_event_overrides",
      { event_id: EVENT_ID, client_id: CLIENT_ID, original_start: THIRD, kind: "cancelled" },
      { onConflict: "event_id,original_start" },
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("[F0-27][AC-03] a one-off event is deleted by cancelling its one occurrence, whatever the scope", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { starts_at: FIRST, recurrence: null },
      error: null,
    });
    const result = await deleteEvent({ ...base, occurrenceOriginalStart: FIRST, scope: "future" });
    expect(result.ok).toBe(true);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("[F0-27][AC-06] 'future' ends the series the day before the viewed occurrence", async () => {
    const result = await deleteEvent({ ...base, scope: "future" });
    expect(result.ok).toBe(true);
    expect(mocks.update).toHaveBeenCalledWith("care_events", { recurrence_until: "2026-10-18" });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("[F0-27][AC-07] 'future' on the first occurrence deactivates the whole series", async () => {
    const result = await deleteEvent({ ...base, occurrenceOriginalStart: FIRST, scope: "future" });
    expect(result.ok).toBe(true);
    expect(mocks.update).toHaveBeenCalledWith("care_events", { is_active: false });
  });

  it("[F0-27][AC-08] says it could not delete when the write fails", async () => {
    mocks.upsert.mockResolvedValue({ error: { code: "XX000" } });
    const result = await deleteEvent({ ...base, scope: "occurrence" });
    expect(result).toEqual({
      ok: false,
      error: { code: "UNEXPECTED", message: "Couldn't delete. Please try again." },
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("[F0-27][AC-01] is refused when the event cannot be read", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    const result = await deleteEvent({ ...base, scope: "occurrence" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_ALLOWED");
  });

  it("[F0-27][AC-09] refreshes cached pages after a delete", async () => {
    await deleteEvent({ ...base, scope: "occurrence" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("[FAM-18][AC-08] refuses a Done occurrence and writes nothing, whatever the scope", async () => {
    mocks.latestCompletion.mockResolvedValue({ data: { action: "done" }, error: null });
    for (const scope of ["occurrence", "future"] as const) {
      const result = await deleteEvent({ ...base, scope });
      expect(result).toEqual({
        ok: false,
        error: { code: "VALIDATION", message: "Completed care can't be deleted." },
      });
    }
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("[FAM-18][AC-08] an undone occurrence can be deleted", async () => {
    mocks.latestCompletion.mockResolvedValue({ data: { action: "undone" }, error: null });
    const result = await deleteEvent({ ...base, scope: "occurrence" });
    expect(result.ok).toBe(true);
  });

  it("[FAM-18][AC-08] in mock mode, refuses a Done occurrence and keeps it", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { OCCURRENCES_BY_CLIENT_ID } = await import("@/mocks/fixtures");
    const done = Object.values(OCCURRENCES_BY_CLIENT_ID)
      .flat()
      .find((row) => row.status === "done")!;
    const result = await deleteEvent({
      clientId: done.clientId,
      eventId: done.eventId,
      occurrenceOriginalStart: done.key.slice(done.eventId.length + 1),
      scope: "occurrence",
    });
    expect(result).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(OCCURRENCES_BY_CLIENT_ID[done.clientId]).toContainEqual(done);
  });
});
