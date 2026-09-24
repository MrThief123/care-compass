// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CARE_EVENTS,
  MARGARET_CLIENT_ID,
  OCCURRENCES_BY_CLIENT_ID,
  PLAIN_EVENT_OCCURRENCES_BY_CLIENT_ID,
  REFERENCE_DATE,
} from "@/mocks/fixtures";
import { localToMelbourneIso, melbourneDateKey } from "@/mocks/melbourne-time";
import { PlainEventOccurrenceSchema } from "@/types/domain";

/**
 * Plain-event fixtures (UI-05, CHG-009): Afternoon walk rows in the reference
 * week. Tasks stay in `OCCURRENCES_BY_CLIENT_ID`, unchanged (FD-01, FD-03).
 */

const REFERENCE_WEEK = ["2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29", "2026-11-30"];

function plainRows() {
  return Object.values(PLAIN_EVENT_OCCURRENCES_BY_CLIENT_ID).flat();
}

function eventOf(eventId: string) {
  return CARE_EVENTS.find((event) => event.id === eventId);
}

describe("[UI-05][AC-05] plain-event fixtures", () => {
  it("[UI-05][AC-05] Margaret has an Afternoon walk on every day of the reference week, including the reference day", () => {
    const walks = (PLAIN_EVENT_OCCURRENCES_BY_CLIENT_ID[MARGARET_CLIENT_ID] ?? []).filter(
      (row) => row.eventId === "event-margaret-walk",
    );

    expect(walks.map((row) => melbourneDateKey(row.start)).sort()).toEqual(REFERENCE_WEEK);
    expect(
      walks.some((row) => melbourneDateKey(row.start) === melbourneDateKey(REFERENCE_DATE)),
    ).toBe(true);
    expect(walks.every((row) => row.start.slice(11, 16) === "14:00")).toBe(true);
  });

  it("[UI-05][AC-05] the Afternoon walk series starts in the reference week, so calendar data shows it", () => {
    const walk = eventOf("event-margaret-walk");

    expect(walk?.completionMode).toBe("automatic");
    expect(walk?.start).toBe("2026-11-26T14:00:00+11:00");
    expect(walk?.durationMinutes).toBe(45);
    expect(walk?.recurrenceFrequency).toBe("daily");
  });

  it("[UI-05][AC-05] every plain-event row parses as a plain event and belongs to an automatic event of its client", () => {
    for (const [clientId, rows] of Object.entries(PLAIN_EVENT_OCCURRENCES_BY_CLIENT_ID)) {
      for (const row of rows) {
        const event = eventOf(row.eventId);
        expect(() => PlainEventOccurrenceSchema.parse(row)).not.toThrow();
        expect(row.clientId).toBe(clientId);
        expect(event?.clientId).toBe(clientId);
        expect(event?.completionMode).toBe("automatic");
        expect(row.title).toBe(event?.title);
        expect(row.description).toBe(event?.description);
        expect(row.durationMinutes).toBe(event?.durationMinutes);
        expect(localToMelbourneIso(row.start.slice(0, 19))).toBe(row.start);
      }
    }
  });

  it("[UI-05][AC-05] every task row belongs to a manual event", () => {
    for (const row of Object.values(OCCURRENCES_BY_CLIENT_ID).flat()) {
      expect(eventOf(row.eventId)?.completionMode).toBe("manual");
    }
  });

  it("[UI-05][AC-05] keys are eventId:start and unique across tasks and plain events", () => {
    const all = [...Object.values(OCCURRENCES_BY_CLIENT_ID).flat(), ...plainRows()];

    expect(new Set(all.map((row) => row.key)).size).toBe(all.length);
    for (const row of plainRows()) {
      expect(row.key).toBe(`${row.eventId}:${row.start}`);
    }
  });
});

describe("[UI-05][AC-05] plain-event fixtures are deterministic", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("[UI-05][AC-05] a fresh load under a different clock, with Math.random forbidden, yields identical plain-event rows", async () => {
    const baseline = structuredClone(PLAIN_EVENT_OCCURRENCES_BY_CLIENT_ID);

    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2031-05-06T07:08:09Z"));
    vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("fixtures must not use Math.random");
    });
    const fresh = await import("@/mocks/fixtures");

    expect(fresh.PLAIN_EVENT_OCCURRENCES_BY_CLIENT_ID).toEqual(baseline);
  });
});
