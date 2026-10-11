import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteEventOccurrence as deleteAction } from "@/server/events/actions";
import { getOccurrences } from "@/server/events/queries";

/*
 * [FAM-18] The mock data source: deleting an occurrence, or this and all future ones, removes the
 * pre-baked rows, and a Done occurrence is refused (the Supabase rules, mirrored).
 */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

const CLIENT = "client-margaret";
const RANGE = { from: "2026-11-23", to: "2026-12-06" };

beforeEach(() => vi.stubEnv("DATA_SOURCE", "mock"));

async function keysFor(eventId: string) {
  const rows = await getOccurrences(CLIENT, RANGE, { type: "all" });
  return rows.filter((row) => row.eventId === eventId).map((row) => row.key);
}

describe("[FAM-18] mock deleteEventOccurrence", () => {
  it("[FAM-18][AC-04] 'occurrence' removes only that occurrence", async () => {
    const before = await keysFor("event-margaret-walk");
    expect(before.length).toBeGreaterThan(1);
    const target = before[before.length - 1]!;
    const originalStart = target.slice(target.indexOf(":") + 1);

    const result = await deleteAction({
      clientId: CLIENT,
      eventId: "event-margaret-walk",
      occurrenceOriginalStart: originalStart,
      scope: "occurrence",
    });

    expect(result.ok).toBe(true);
    expect(await keysFor("event-margaret-walk")).toEqual(before.filter((key) => key !== target));
  });

  it("[FAM-18][AC-05][AC-06] 'future' removes that occurrence and every later one, keeping earlier ones", async () => {
    const before = await keysFor("event-margaret-walk");
    const sorted = [...before].sort();
    const from = sorted[Math.floor(sorted.length / 2)]!;

    await deleteAction({
      clientId: CLIENT,
      eventId: "event-margaret-walk",
      occurrenceOriginalStart: from.slice(from.indexOf(":") + 1),
      scope: "future",
    });

    const after = await keysFor("event-margaret-walk");
    expect(after).toEqual(sorted.filter((key) => key < from));
  });

  it("[FAM-18][AC-08] refuses a Done occurrence", async () => {
    const result = await deleteAction({
      clientId: CLIENT,
      eventId: "event-margaret-morning-meds",
      occurrenceOriginalStart: "2026-11-30T09:00:00+11:00",
      scope: "occurrence",
    });
    expect(result).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
  });

  it("[FAM-18][AC-10] another client's event is not found", async () => {
    const result = await deleteAction({
      clientId: "client-robert",
      eventId: "event-margaret-walk",
      occurrenceOriginalStart: "2026-11-30T09:00:00+11:00",
      scope: "occurrence",
    });
    expect(result).toMatchObject({ ok: false });
  });
});
