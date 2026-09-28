// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_PROFILE,
  CARE_EVENTS,
  CARER_NOTIFICATIONS,
  CARER_PROFILES,
  CLIENTS,
  DOCUMENTS,
  EVENT_DOCUMENTS,
  FAMILY_PROFILES,
  FUND_ENTRIES,
  MARGARET_CLIENT_ID,
  OCCURRENCES_BY_CLIENT_ID,
  ORGANISATION,
  RAW_BUDGET_BUCKETS_BY_CLIENT_ID,
  REFERENCE_DATE,
  SHIFTS,
  STAFF_MEMBERS,
  TEMPORARY_CARERS,
} from "@/mocks/fixtures";
import { localToMelbourneIso, melbourneDateKey } from "@/mocks/melbourne-time";
import { getClientHeaderSummary } from "@/server/clients/queries";
import { getEventDocuments } from "@/server/documents/queries";
import { getOccurrence, getTaskLog, getTodayOccurrences } from "@/server/events/queries";
import {
  CarerNotificationSchema,
  CareEventSchema,
  ClientSchema,
  DocumentRefSchema,
  EventDocumentSchema,
  FundEntrySchema,
  OccurrenceSchema,
  OrganisationSchema,
  ProfileSchema,
  ShiftSchema,
  StaffMemberSchema,
  TASK_LOG_PAGE_SIZE,
} from "@/types/domain";
import type { Occurrence, OccurrenceStatus, TaskLogQuery } from "@/types/domain";

/**
 * Fixture-specific expectations (UI-04): the design dataset, the long
 * history, documents, and the integrity rules every fixture must keep.
 * Everything is read through the `src/server/**` contract functions the
 * screens use, except the integrity checks, which read the raw fixtures.
 */

const mocksDir = path.dirname(fileURLToPath(import.meta.url));
const ROBERT_CLIENT_ID = "client-robert";
const MORNING_MEDICATION_KEY = "event-margaret-morning-meds:2026-11-30T09:00:00+11:00";

/** `docs/design/screens/family-07-task-log.png`, newest first by the contract's rule (DECISIONS.md FD-05). */
const DESIGN_WEEK: Array<[start: string, title: string, status: OccurrenceStatus, nurse: string]> =
  [
    ["2026-11-30T15:00:00+11:00", "Afternoon check-in", "planned", "Aisha Rahman"],
    ["2026-11-30T11:30:00+11:00", "Physiotherapy", "planned", "Aisha Rahman"],
    ["2026-11-30T09:00:00+11:00", "Morning medication", "done", "Aisha Rahman"],
    ["2026-11-29T18:00:00+11:00", "Evening medication", "done", "Aisha Rahman"],
    ["2026-11-29T09:30:00+11:00", "Weekly weigh-in", "overdue", "—"],
    ["2026-11-28T11:30:00+11:00", "Physiotherapy", "done", "Aisha Rahman"],
    ["2026-11-28T10:00:00+11:00", "Medication review", "overdue", "—"],
    ["2026-11-27T09:00:00+11:00", "Morning medication", "done", "Aisha Rahman"],
    ["2026-11-26T10:00:00+11:00", "Wound dressing check", "done", "Aisha Rahman"],
  ];

function nurse(row: Occurrence): string {
  return row.actor ?? row.assignee ?? "—";
}

async function readAllPages(clientId: string, query: TaskLogQuery = {}): Promise<Occurrence[]> {
  const rows: Occurrence[] = [];
  for (let page = 1; page <= 200; page += 1) {
    const result = await getTaskLog(clientId, { ...query, page });
    if (result.items.length === 0) return rows;
    rows.push(...result.items);
  }
  throw new Error("readAllPages: more than 200 pages, the log is not terminating");
}

function allOccurrences(): Occurrence[] {
  return Object.values(OCCURRENCES_BY_CLIENT_ID).flat();
}

const STAFF_FULL_NAMES = STAFF_MEMBERS.map((staff) => `${staff.firstName} ${staff.lastName}`);

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("[UI-04][AC-08] Margaret's design dataset", () => {
  it("[UI-04][AC-08] the header reads 78 years, Preston VIC, Banksia Home Care", async () => {
    const summary = await getClientHeaderSummary(MARGARET_CLIENT_ID);

    expect(summary).toMatchObject({
      firstName: "Margaret",
      age: 78,
      suburb: "Preston VIC",
      organisationName: "Banksia Home Care",
    });
  });

  it("[UI-04][AC-08] the Task log holds exactly the nine design rows for 26 to 30 Nov 2026", async () => {
    const rows = await readAllPages(MARGARET_CLIENT_ID);

    const designWeek = rows
      .filter((row) => {
        const day = melbourneDateKey(row.start);
        return day >= "2026-11-26" && day <= "2026-11-30";
      })
      .map((row) => [row.start, row.title, row.status, nurse(row)]);

    expect(designWeek).toEqual(DESIGN_WEEK);
  });

  it("[UI-04][AC-08] Overdue is exactly Weekly weigh-in and Medication review, with no nurse", async () => {
    const overdue = await getTaskLog(MARGARET_CLIENT_ID, { status: "overdue" });

    expect(overdue.total).toBe(2);
    expect(overdue.items.map((row) => row.title)).toEqual(["Weekly weigh-in", "Medication review"]);
    for (const row of overdue.items) {
      expect(row.actor).toBeUndefined();
      expect(row.assignee).toBeUndefined();
      expect(row.completedAt).toBeUndefined();
    }
  });

  it("[UI-04][AC-08] the five newest done-or-overdue rows on page 1 are the design's Recent activity", async () => {
    const page1 = await getTaskLog(MARGARET_CLIENT_ID);

    const recent = page1.items
      .filter((row) => row.status !== "planned")
      .slice(0, 5)
      .map((row) => [row.title, melbourneDateKey(row.start), row.status]);

    expect(recent).toEqual([
      ["Morning medication", "2026-11-30", "done"],
      ["Evening medication", "2026-11-29", "done"],
      ["Weekly weigh-in", "2026-11-29", "overdue"],
      ["Physiotherapy", "2026-11-28", "done"],
      ["Medication review", "2026-11-28", "overdue"],
    ]);
  });

  it("[UI-04][AC-08] Today shows Morning medication (Done), Physiotherapy (1 hr 30 min) and Afternoon check-in, oldest first", async () => {
    const today = await getTodayOccurrences(MARGARET_CLIENT_ID);

    expect(
      today.map((row) => [row.title, row.start, row.status, row.durationMinutes, nurse(row)]),
    ).toEqual([
      ["Morning medication", "2026-11-30T09:00:00+11:00", "done", 60, "Aisha Rahman"],
      ["Physiotherapy", "2026-11-30T11:30:00+11:00", "planned", 90, "Aisha Rahman"],
      ["Afternoon check-in", "2026-11-30T15:00:00+11:00", "planned", 60, "Aisha Rahman"],
    ]);
  });

  it("[UI-04][AC-08] the Morning medication detail: Done by Aisha Rahman at 09:14, design description, Medication chart.pdf", async () => {
    const detail = await getOccurrence(MARGARET_CLIENT_ID, MORNING_MEDICATION_KEY);
    const documents = await getEventDocuments(MARGARET_CLIENT_ID, detail?.eventId ?? "");

    expect(detail).toMatchObject({
      title: "Morning medication",
      status: "done",
      actor: "Aisha Rahman",
      assignee: "Aisha Rahman",
      completedAt: "2026-11-30T09:14:00+11:00",
      description:
        "Administer morning medication as per the current care plan. Confirm with Margaret before administering and record any side effects.",
    });
    expect(documents.map((document) => document.name)).toEqual(["Medication chart.pdf"]);
  });

  it("[UI-04][AC-08] the former overdue Collect prescription is gone from Margaret's log", async () => {
    const rows = await readAllPages(MARGARET_CLIENT_ID, { q: "prescription" });

    expect(rows).toEqual([]);
  });
});

describe("[UI-04][AC-09] Margaret's long history", () => {
  it("[UI-04][AC-09] has at least 120 completed occurrences before the design week", async () => {
    const rows = await readAllPages(MARGARET_CLIENT_ID);

    const history = rows.filter((row) => melbourneDateKey(row.start) < "2026-11-26");
    expect(history.length).toBeGreaterThanOrEqual(120);
    expect(history.every((row) => row.status === "done")).toBe(true);
  });

  it("[UI-04][AC-02] the log is 137 rows over 7 pages: six of 20, then 17, then nothing", async () => {
    const first = await getTaskLog(MARGARET_CLIENT_ID);

    expect(first.total).toBe(137);
    for (let page = 1; page <= 6; page += 1) {
      const result = await getTaskLog(MARGARET_CLIENT_ID, { page });
      expect(result.items).toHaveLength(TASK_LOG_PAGE_SIZE);
    }
    expect((await getTaskLog(MARGARET_CLIENT_ID, { page: 7 })).items).toHaveLength(17);
    expect(await getTaskLog(MARGARET_CLIENT_ID, { page: 8 })).toEqual({
      items: [],
      page: 8,
      pageSize: TASK_LOG_PAGE_SIZE,
      total: 137,
    });
  });

  it("[UI-04][AC-01] the whole log equals the fixture rows sorted newest first by instant, ties by key", async () => {
    const expected = [...(OCCURRENCES_BY_CLIENT_ID[MARGARET_CLIENT_ID] ?? [])]
      .sort((a, b) => {
        const byInstant = Date.parse(b.start) - Date.parse(a.start);
        if (byInstant !== 0) return byInstant;
        return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
      })
      .map((row) => row.key);

    const rows = await readAllPages(MARGARET_CLIENT_ID);

    expect(rows.map((row) => row.key)).toEqual(expected);
  });

  it("[UI-04][AC-09] page 1 holds the nine design rows then the eleven newest history rows", async () => {
    const page1 = await getTaskLog(MARGARET_CLIENT_ID);

    expect(page1.items.slice(0, 9).map((row) => row.start)).toEqual(
      DESIGN_WEEK.map((row) => row[0]),
    );
    expect(page1.items.slice(9).map((row) => [row.title, row.start.slice(0, 16)])).toEqual([
      ["Evening medication", "2026-11-25T18:00"],
      [
        "Administer prescribed eye drops to both eyes, check for redness or discharge, and record it in the log",
        "2026-11-25T16:30",
      ],
      ["Morning medication", "2026-11-25T09:00"],
      ["Evening medication", "2026-11-24T18:00"],
      ["Morning medication", "2026-11-24T09:00"],
      ["Evening medication", "2026-11-23T18:00"],
      ["Morning medication", "2026-11-23T09:00"],
      ["Evening medication", "2026-11-22T18:00"],
      ["Weekly weigh-in", "2026-11-22T09:30"],
      ["Morning medication", "2026-11-22T09:00"],
      ["Evening medication", "2026-11-21T18:00"],
    ]);
  });

  it("[UI-04][AC-09] page 1 exercises a task title of about 100 characters and a carer name of about 50", async () => {
    const page1 = await getTaskLog(MARGARET_CLIENT_ID);

    const longestTitle = Math.max(...page1.items.map((row) => row.title.length));
    const longestNurse = Math.max(...page1.items.map((row) => nurse(row).length));
    expect(longestTitle).toBeGreaterThanOrEqual(95);
    expect(longestTitle).toBeLessThanOrEqual(105);
    expect(longestNurse).toBeGreaterThanOrEqual(45);
    expect(longestNurse).toBeLessThanOrEqual(55);
  });

  it("[UI-04][AC-09] the history crosses the 4 Oct 2026 daylight-saving change, so both +10:00 and +11:00 offsets occur", () => {
    const history = (OCCURRENCES_BY_CLIENT_ID[MARGARET_CLIENT_ID] ?? []).filter(
      (row) => melbourneDateKey(row.start) < "2026-11-26",
    );

    expect(history.some((row) => row.start.endsWith("+10:00"))).toBe(true);
    expect(history.some((row) => row.start.endsWith("+11:00"))).toBe(true);
  });

  it("[UI-04][AC-04] q 'check' matches exactly one full page (20 rows) and 'evening' one row over two pages (41)", async () => {
    const check = await getTaskLog(MARGARET_CLIENT_ID, { q: "check" });
    const checkPage2 = await getTaskLog(MARGARET_CLIENT_ID, { q: "check", page: 2 });
    const evening = await getTaskLog(MARGARET_CLIENT_ID, { q: "evening" });
    const eveningPage3 = await getTaskLog(MARGARET_CLIENT_ID, { q: "evening", page: 3 });

    expect(check.total).toBe(20);
    expect(check.items).toHaveLength(20);
    expect(checkPage2).toMatchObject({ items: [], total: 20, page: 2 });
    expect(evening.total).toBe(41);
    expect(eveningPage3.items).toHaveLength(1);
  });

  it("[UI-04][AC-04] totals over the whole history: status split 133 done, 2 overdue, 2 planned", async () => {
    const done = await getTaskLog(MARGARET_CLIENT_ID, { status: "done" });
    const overdue = await getTaskLog(MARGARET_CLIENT_ID, { status: "overdue" });
    const planned = await getTaskLog(MARGARET_CLIENT_ID, { status: "planned" });

    expect([done.total, overdue.total, planned.total]).toEqual([133, 2, 2]);
  });

  it("[UI-04][AC-04] q and status together count only rows matching both", async () => {
    const result = await getTaskLog(MARGARET_CLIENT_ID, { q: "medication", status: "overdue" });

    expect(result.total).toBe(1);
    expect(result.items.map((row) => row.title)).toEqual(["Medication review"]);
  });
});

describe("[UI-04][AC-05] getOccurrence over the fixtures", () => {
  it("[UI-04][AC-05] opens the oldest history row and a planned row that is later than the reference time", async () => {
    const rows = await readAllPages(MARGARET_CLIENT_ID);
    const oldest = rows[rows.length - 1] as Occurrence;
    const planned = rows.filter((row) => row.status === "planned");

    expect(await getOccurrence(MARGARET_CLIENT_ID, oldest.key)).toEqual(oldest);
    expect(Date.parse(oldest.start)).toBeLessThan(Date.parse("2026-09-06T00:00:00+10:00"));
    expect(planned.length).toBeGreaterThan(0);
    for (const row of planned) {
      expect(Date.parse(row.start)).toBeGreaterThan(Date.parse(REFERENCE_DATE));
      expect(await getOccurrence(MARGARET_CLIENT_ID, row.key)).toEqual(row);
    }
  });

  it("[UI-04][AC-05] opens every one of Margaret's 137 occurrences by key", async () => {
    const rows = await readAllPages(MARGARET_CLIENT_ID);

    for (const row of rows) {
      expect((await getOccurrence(MARGARET_CLIENT_ID, row.key))?.key).toBe(row.key);
    }
  });

  it("[UI-04][AC-05] Robert's occurrences are his own: Margaret cannot read them and he cannot read hers", async () => {
    const roberts = await readAllPages(ROBERT_CLIENT_ID);
    const margarets = await readAllPages(MARGARET_CLIENT_ID);

    expect(roberts.length).toBeGreaterThan(0);
    expect(roberts.every((row) => row.clientId === ROBERT_CLIENT_ID)).toBe(true);
    for (const row of roberts) {
      expect(await getOccurrence(ROBERT_CLIENT_ID, row.key)).toEqual(row);
      expect(await getOccurrence(MARGARET_CLIENT_ID, row.key)).toBeUndefined();
    }
    for (const row of margarets.slice(0, 40)) {
      expect(await getOccurrence(ROBERT_CLIENT_ID, row.key)).toBeUndefined();
    }
  });

  it("[UI-04][AC-05] Robert's log never contains one of Margaret's rows", async () => {
    const roberts = await readAllPages(ROBERT_CLIENT_ID);
    const margaretKeys = new Set(
      (OCCURRENCES_BY_CLIENT_ID[MARGARET_CLIENT_ID] ?? []).map((row) => row.key),
    );

    expect(roberts.some((row) => margaretKeys.has(row.key))).toBe(false);
  });
});

describe("[UI-04][AC-06] event documents over the fixtures", () => {
  it("[UI-04][AC-06] Morning medication has Medication chart.pdf", async () => {
    const documents = await getEventDocuments(MARGARET_CLIENT_ID, "event-margaret-morning-meds");

    expect(documents).toHaveLength(1);
    expect(documents[0]).toMatchObject({
      name: "Medication chart.pdf",
      mimeType: "application/pdf",
      clientId: MARGARET_CLIENT_ID,
    });
    expect(documents[0]?.sizeBytes).toBeGreaterThan(0);
  });

  it("[UI-04][AC-06] Physiotherapy has several documents, oldest upload first", async () => {
    const documents = await getEventDocuments(MARGARET_CLIENT_ID, "event-margaret-physio");

    expect(documents.map((document) => document.name)).toEqual([
      "Physio referral.pdf",
      "Exercise plan.pdf",
    ]);
  });

  it("[UI-04][AC-06] a photo and a document with a very long name are attached too", async () => {
    const photo = await getEventDocuments(MARGARET_CLIENT_ID, "event-margaret-wound-dressing");
    const long = await getEventDocuments(MARGARET_CLIENT_ID, "event-margaret-eye-drops");

    expect(photo.map((document) => document.mimeType)).toEqual(["image/jpeg"]);
    expect(long).toHaveLength(1);
    expect(long[0]?.name.length).toBeGreaterThanOrEqual(80);
  });

  it("[UI-04][AC-06] an event with no documents returns an empty array", async () => {
    expect(await getEventDocuments(MARGARET_CLIENT_ID, "event-margaret-evening-meds")).toEqual([]);
  });

  it("[UI-04][AC-06] another client's documents are never returned, and Robert's event is not Margaret's", async () => {
    const roberts = await getEventDocuments(ROBERT_CLIENT_ID, "event-robert-morning-meds");

    expect(roberts.length).toBeGreaterThan(0);
    expect(roberts.every((document) => document.clientId === ROBERT_CLIENT_ID)).toBe(true);
    expect(await getEventDocuments(MARGARET_CLIENT_ID, "event-robert-morning-meds")).toEqual([]);
    expect(await getEventDocuments(ROBERT_CLIENT_ID, "event-margaret-morning-meds")).toEqual([]);
    expect(await getEventDocuments(ROBERT_CLIENT_ID, "event-margaret-physio")).toEqual([]);
  });
});

describe("[UI-04][AC-10] fixture integrity", () => {
  it("[UI-04][AC-10] occurrence keys are unique across all clients and equal eventId:start", () => {
    const rows = allOccurrences();

    expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
    for (const row of rows) {
      expect(row.key).toBe(`${row.eventId}:${row.start}`);
    }
  });

  it("[UI-04][AC-10] every occurrence belongs to a real client and a real event of that client, and copies its title, description and duration", () => {
    const clientIds = new Set(CLIENTS.map((client) => client.id));

    for (const [clientId, rows] of Object.entries(OCCURRENCES_BY_CLIENT_ID)) {
      expect(clientIds.has(clientId)).toBe(true);
      for (const row of rows) {
        const event = CARE_EVENTS.find((candidate) => candidate.id === row.eventId);
        expect(row.clientId).toBe(clientId);
        expect(event?.clientId).toBe(clientId);
        expect(row.title).toBe(event?.title);
        expect(row.description).toBe(event?.description);
        expect(row.durationMinutes).toBe(event?.durationMinutes);
      }
    }
  });

  it("[UI-04][AC-10] event ids are unique and every event belongs to a real client", () => {
    const clientIds = new Set(CLIENTS.map((client) => client.id));

    expect(new Set(CARE_EVENTS.map((event) => event.id)).size).toBe(CARE_EVENTS.length);
    expect(CARE_EVENTS.every((event) => clientIds.has(event.clientId))).toBe(true);
  });

  it("[UI-04][AC-10] Done rows have an actor and a completion time no earlier than the start; other rows have neither", () => {
    for (const row of allOccurrences()) {
      if (row.status === "done") {
        expect(row.actor).toBeTruthy();
        expect(row.completedAt).toBeTruthy();
        expect(Date.parse(row.completedAt ?? "")).toBeGreaterThanOrEqual(Date.parse(row.start));
      } else {
        expect(row.actor).toBeUndefined();
        expect(row.completedAt).toBeUndefined();
      }
    }
  });

  it("[UI-04][AC-10] every actor and assignee is a staff full name or a listed temporary carer", () => {
    const known = new Set<string>([...STAFF_FULL_NAMES, ...TEMPORARY_CARERS]);

    for (const row of allOccurrences()) {
      for (const name of [row.actor, row.assignee]) {
        if (name !== undefined) expect(known.has(name)).toBe(true);
      }
    }
    expect(TEMPORARY_CARERS.every((name) => !STAFF_FULL_NAMES.includes(name))).toBe(true);
  });

  it("[UI-04][AC-10] every start, completion and upload time is a valid instant with an explicit offset", () => {
    const offsetPattern = /(Z|[+-]\d{2}:\d{2})$/;
    const stamps = [
      ...allOccurrences().flatMap((row) => [row.start, row.completedAt ?? row.start]),
      ...EVENT_DOCUMENTS.map((document) => document.uploadedAt),
    ];

    for (const stamp of stamps) {
      expect(Number.isNaN(Date.parse(stamp))).toBe(false);
      expect(stamp).toMatch(offsetPattern);
    }
  });

  it("[UI-04][AC-10] every written offset is the one Melbourne really has at that moment (daylight saving)", () => {
    const stamps = [
      ...CARE_EVENTS.map((event) => event.start),
      ...allOccurrences().flatMap((row) => [row.start, row.completedAt ?? row.start]),
      ...EVENT_DOCUMENTS.map((document) => document.uploadedAt),
    ];

    for (const stamp of stamps) {
      expect(localToMelbourneIso(stamp.slice(0, 19))).toBe(stamp);
    }
  });

  it("[UI-04][AC-10] every document belongs to an existing event of its own client, with a unique id", () => {
    expect(new Set(EVENT_DOCUMENTS.map((document) => document.id)).size).toBe(
      EVENT_DOCUMENTS.length,
    );
    for (const document of EVENT_DOCUMENTS) {
      const event = CARE_EVENTS.find((candidate) => candidate.id === document.eventId);
      expect(event?.clientId).toBe(document.clientId);
    }
  });

  it("[UI-04][AC-10] some events carry documents and one event carries several", () => {
    const perEvent = new Map<string, number>();
    for (const document of EVENT_DOCUMENTS) {
      perEvent.set(document.eventId, (perEvent.get(document.eventId) ?? 0) + 1);
    }

    expect(perEvent.size).toBeGreaterThanOrEqual(4);
    expect(Math.max(...perEvent.values())).toBeGreaterThanOrEqual(2);
  });

  it("[UI-04][AC-10] every fixture record parses with its Zod schema", () => {
    expect(() => OrganisationSchema.parse(ORGANISATION)).not.toThrow();
    CLIENTS.forEach((client) => ClientSchema.parse(client));
    [...FAMILY_PROFILES, ...CARER_PROFILES, ADMIN_PROFILE].forEach((profile) =>
      ProfileSchema.parse(profile),
    );
    STAFF_MEMBERS.forEach((staff) => StaffMemberSchema.parse(staff));
    CARE_EVENTS.forEach((event) => CareEventSchema.parse(event));
    allOccurrences().forEach((row) => OccurrenceSchema.parse(row));
    SHIFTS.forEach((shift) => ShiftSchema.parse(shift));
    FUND_ENTRIES.forEach((entry) => FundEntrySchema.parse(entry));
    DOCUMENTS.forEach((document) => DocumentRefSchema.parse(document));
    EVENT_DOCUMENTS.forEach((document) => EventDocumentSchema.parse(document));
    CARER_NOTIFICATIONS.forEach((notification) => CarerNotificationSchema.parse(notification));
  });

  it("[UI-04][AC-10] the other clients, staff, shifts, notifications and budgets stay valid and unchanged", () => {
    expect(CLIENTS.map((client) => client.id)).toEqual([
      "client-margaret",
      "client-robert",
      "client-elsie",
      "client-frank",
      "client-doris",
      "client-harold",
      "client-jean",
    ]);
    expect(CLIENTS.find((client) => client.id === "client-robert")).toMatchObject({
      dob: "1944-03-18",
      suburb: "Reservoir VIC",
    });
    expect(STAFF_FULL_NAMES).toEqual([
      "Aisha Rahman",
      "Daniel K.",
      "Sarah Nguyen",
      "Marcus Chen",
      "Fatima Ali",
    ]);
    expect(
      RAW_BUDGET_BUCKETS_BY_CLIENT_ID[MARGARET_CLIENT_ID]?.map((b) => [b.total, b.used]),
    ).toEqual([
      [24000, 9120],
      [5000, 2250],
      [3000, 2760],
    ]);
    expect(
      RAW_BUDGET_BUCKETS_BY_CLIENT_ID[ROBERT_CLIENT_ID]?.map((b) => [b.total, b.used]),
    ).toEqual([
      [18000, 4000],
      [4000, 1200],
      [2500, 500],
    ]);

    const staffIds = new Set(STAFF_MEMBERS.map((staff) => staff.id));
    const clientIds = new Set(CLIENTS.map((client) => client.id));
    for (const shift of SHIFTS) {
      expect(staffIds.has(shift.carerId)).toBe(true);
      expect(clientIds.has(shift.clientId)).toBe(true);
      expect(Date.parse(shift.start)).toBeLessThan(Date.parse(shift.end));
    }
    for (const notification of CARER_NOTIFICATIONS) {
      expect(staffIds.has(notification.carerId)).toBe(true);
    }
  });

  it("[UI-04][AC-10] the reference date is still Monday 30 November 2026", () => {
    expect(REFERENCE_DATE).toBe("2026-11-30T09:00:00+11:00");
  });
});

describe("[UI-04][AC-10] fixtures are deterministic", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("[UI-04][AC-10] a fresh load under a different clock, with Math.random forbidden, yields identical data", async () => {
    const baseline = structuredClone({
      occurrences: OCCURRENCES_BY_CLIENT_ID,
      events: CARE_EVENTS,
      documents: EVENT_DOCUMENTS,
    });

    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2031-05-06T07:08:09Z"));
    vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("fixtures must not use Math.random");
    });
    const fresh = await import("@/mocks/fixtures");

    expect(fresh.OCCURRENCES_BY_CLIENT_ID).toEqual(baseline.occurrences);
    expect(fresh.CARE_EVENTS).toEqual(baseline.events);
    expect(fresh.EVENT_DOCUMENTS).toEqual(baseline.documents);
  });

  it("[UI-04][AC-10] the fixture sources never read the clock or a random number", () => {
    for (const file of ["fixtures.ts", "history.ts", "melbourne-time.ts"]) {
      const source = readFileSync(path.join(mocksDir, file), "utf8");

      expect(source).not.toMatch(/Date\.now\s*\(|Math\.random\s*\(|new Date\(\s*\)/);
    }
  });

  it("[UI-04][AC-10] two reads through the contract return the same rows", async () => {
    const a = await readAllPages(MARGARET_CLIENT_ID);
    const b = await readAllPages(MARGARET_CLIENT_ID);

    expect(b).toEqual(a);
  });
});
