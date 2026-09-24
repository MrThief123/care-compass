/**
 * Design fixtures (UI-00).
 *
 * Synthetic sample data only (CLAUDE.md §12 — client data is health/
 * financial information about vulnerable people; no real names or
 * figures). Content and figures match the Figma designs at the project's
 * reference date **Monday 30 November 2026** (Australia/Melbourne).
 *
 * Margaret carries the fully worked data set (UI-04, CHG-004): the design
 * week 26–30 Nov 2026 exactly as drawn, and a long history before it that is
 * generated in code (`src/mocks/history.ts`) so the Task log has many pages.
 * Nothing here reads the clock or a random number.
 *
 * This module is read only by `src/mocks/queries/*` and
 * `src/mocks/current-user.ts`. It must never be imported by `src/app` or
 * `src/features` (lint-enforced, see eslint.config.mjs) — screens read
 * data through `src/server/<domain>/queries.ts` instead.
 */
import { generateCompletedHistory, generatePlainEventOccurrences } from "@/mocks/history";
import type {
  BudgetBucketKind,
  BudgetBucketState,
  BudgetBucketSummary,
  CarerNotification,
  CareEvent,
  Client,
  DocumentRef,
  EventDocument,
  FundEntry,
  Occurrence,
  Organisation,
  PlainEventOccurrence,
  Profile,
  Shift,
  StaffMember,
} from "@/types/domain";

export const REFERENCE_DATE = "2026-11-30T09:00:00+11:00"; // Monday 30 November 2026, Australia/Melbourne

// ---------------------------------------------------------------------------
// Organisation
// ---------------------------------------------------------------------------

export const ORGANISATION: Organisation = {
  id: "org-banksia",
  name: "Banksia Home Care",
  abn: "12 345 678 901",
  phone: "(03) 5550 1234",
  address: "24 Wattle Street, Ringwood VIC 3134",
};

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export const CLIENTS: Client[] = [
  {
    id: "client-margaret",
    organisationId: ORGANISATION.id,
    firstName: "Margaret",
    lastName: "Doyle",
    // 78 on the reference date, as every design header reads.
    dob: "1948-04-12",
    // The shell header prints this field verbatim and the design writes the state
    // in the same string ("78 years · Preston VIC · Banksia Home Care"), so the
    // state lives here until the clients schema has its own field (F0-06).
    suburb: "Preston VIC",
  },
  {
    id: "client-robert",
    organisationId: ORGANISATION.id,
    firstName: "Robert",
    lastName: "Hale",
    dob: "1945-03-18",
    suburb: "Croydon",
  },
  {
    id: "client-elsie",
    organisationId: ORGANISATION.id,
    firstName: "Elsie",
    lastName: "Marsh",
    dob: "1938-07-22",
    suburb: "Box Hill",
  },
  {
    id: "client-frank",
    organisationId: ORGANISATION.id,
    firstName: "Frank",
    lastName: "Novak",
    dob: "1952-01-09",
    suburb: "Mitcham",
  },
  {
    id: "client-doris",
    organisationId: ORGANISATION.id,
    firstName: "Doris",
    lastName: "Petrov",
    dob: "1941-09-30",
    suburb: "Vermont",
  },
  {
    id: "client-harold",
    organisationId: ORGANISATION.id,
    firstName: "Harold",
    lastName: "Byrne",
    dob: "1948-05-14",
    suburb: "Blackburn",
  },
  {
    id: "client-jean",
    organisationId: ORGANISATION.id,
    firstName: "Jean",
    lastName: "Ahmed",
    dob: "1955-11-02",
    suburb: "Nunawading",
  },
];

export const MARGARET_CLIENT_ID = "client-margaret";
export const ROBERT_CLIENT_ID = "client-robert";

// ---------------------------------------------------------------------------
// Profiles: family, carers, admin
// ---------------------------------------------------------------------------

export const FAMILY_PROFILES: Profile[] = [
  {
    id: "profile-helen",
    organisationId: ORGANISATION.id,
    role: "family",
    firstName: "Helen",
    lastName: "Doyle",
    email: "helen.doyle@example.com",
    isActive: true,
  },
  {
    id: "profile-michael",
    organisationId: ORGANISATION.id,
    role: "family",
    firstName: "Michael",
    lastName: "Hale",
    email: "michael.hale@example.com",
    isActive: true,
  },
  {
    id: "profile-susan",
    organisationId: ORGANISATION.id,
    role: "family",
    firstName: "Susan",
    lastName: "Marsh",
    email: "susan.marsh@example.com",
    isActive: true,
  },
  {
    id: "profile-karen",
    organisationId: ORGANISATION.id,
    role: "family",
    firstName: "Karen",
    lastName: "Novak",
    email: "karen.novak@example.com",
    isActive: true,
  },
  {
    id: "profile-tom",
    organisationId: ORGANISATION.id,
    role: "family",
    firstName: "Tom",
    lastName: "Petrov",
    email: "tom.petrov@example.com",
    isActive: true,
  },
];

/** PD-038: job titles are a per-organisation editable list seeded with these three values. */
export const SEED_JOB_TITLES = ["Registered Nurse", "Enrolled Nurse", "Support Worker"] as const;

export const STAFF_MEMBERS: StaffMember[] = [
  {
    id: "staff-aisha",
    organisationId: ORGANISATION.id,
    firstName: "Aisha",
    lastName: "Rahman",
    jobTitle: "Registered Nurse",
    email: "aisha.rahman@banksiahomecare.example",
    isActive: true,
  },
  {
    id: "staff-daniel",
    organisationId: ORGANISATION.id,
    firstName: "Daniel",
    lastName: "K.",
    jobTitle: "Enrolled Nurse",
    email: "daniel.k@banksiahomecare.example",
    isActive: true,
  },
  {
    id: "staff-sarah",
    organisationId: ORGANISATION.id,
    firstName: "Sarah",
    lastName: "Nguyen",
    jobTitle: "Support Worker",
    email: "sarah.nguyen@banksiahomecare.example",
    isActive: true,
  },
  {
    id: "staff-marcus",
    organisationId: ORGANISATION.id,
    firstName: "Marcus",
    lastName: "Chen",
    jobTitle: "Support Worker",
    email: "marcus.chen@banksiahomecare.example",
    isActive: true,
  },
  {
    id: "staff-fatima",
    organisationId: ORGANISATION.id,
    firstName: "Fatima",
    lastName: "Ali",
    jobTitle: "Registered Nurse",
    email: "fatima.ali@banksiahomecare.example",
    isActive: true,
  },
];

export const CARER_PROFILES: Profile[] = STAFF_MEMBERS.map((staff) => ({
  id: staff.id,
  organisationId: staff.organisationId,
  role: "carer",
  firstName: staff.firstName,
  lastName: staff.lastName,
  email: staff.email,
  jobTitle: staff.jobTitle,
  isActive: staff.isActive,
}));

export const ADMIN_PROFILE: Profile = {
  id: "profile-priya",
  organisationId: ORGANISATION.id,
  role: "admin",
  firstName: "Priya",
  lastName: "Iyer",
  email: "priya.iyer@banksiahomecare.example",
  jobTitle: "Organisation Admin",
  isActive: true,
};

// ---------------------------------------------------------------------------
// Care events and occurrences (Margaret is the fully-worked example)
// ---------------------------------------------------------------------------

/**
 * Temporary or agency carers who complete tasks without being on the staff
 * list (REQ-19: completion records who did it, including temporary staff).
 * The long name is deliberate: it exercises name layouts (about 50 characters).
 */
export const TEMPORARY_CARERS = ["Anastasia Wilhelmina Konstantinopoulos-Featherstone"] as const;

const AISHA = "Aisha Rahman";
const DANIEL = "Daniel K.";
const SARAH = "Sarah Nguyen";
const MARCUS = "Marcus Chen";
const FATIMA = "Fatima Ali";

const MORNING_MEDS: CareEvent = {
  id: "event-margaret-morning-meds",
  clientId: MARGARET_CLIENT_ID,
  title: "Morning medication",
  description:
    "Administer morning medication as per the current care plan. Confirm with Margaret before administering and record any side effects.",
  start: "2026-10-17T09:00:00+11:00",
  durationMinutes: 60,
  recurrenceFrequency: "daily",
  completionMode: "manual",
};

const EVENING_MEDS: CareEvent = {
  id: "event-margaret-evening-meds",
  clientId: MARGARET_CLIENT_ID,
  title: "Evening medication",
  description:
    "Administer evening medication as per the current care plan and record the time given.",
  start: "2026-10-17T18:00:00+11:00",
  durationMinutes: 30,
  recurrenceFrequency: "daily",
  completionMode: "manual",
};

const PHYSIO: CareEvent = {
  id: "event-margaret-physio",
  clientId: MARGARET_CLIENT_ID,
  title: "Physiotherapy",
  // The Edit event design says "30-minute" while Home draws 1 hr 30 min; the duration wins.
  description:
    "Mobility and strength session with the physiotherapist. Focus on balance exercises per the current care plan.",
  start: "2026-09-05T11:30:00+10:00",
  durationMinutes: 90,
  recurrenceFrequency: "weekly",
  completionMode: "manual",
};

const AFTERNOON_CHECK_IN: CareEvent = {
  id: "event-margaret-afternoon-checkin",
  clientId: MARGARET_CLIENT_ID,
  title: "Afternoon check-in",
  description: "Check in with Margaret, offer a drink and a snack, and note how she is feeling.",
  start: "2026-11-30T15:00:00+11:00",
  durationMinutes: 60,
  recurrenceFrequency: "daily",
  completionMode: "manual",
};

const WEIGH_IN: CareEvent = {
  id: "event-margaret-weigh-in",
  clientId: MARGARET_CLIENT_ID,
  title: "Weekly weigh-in",
  description: "Weigh Margaret on the bathroom scales and record the reading in the care log.",
  start: "2026-09-06T09:30:00+10:00",
  durationMinutes: 15,
  recurrenceFrequency: "weekly",
  completionMode: "manual",
};

const MED_REVIEW: CareEvent = {
  id: "event-margaret-med-review",
  clientId: MARGARET_CLIENT_ID,
  title: "Medication review",
  description:
    "Review current medications against the care plan and note any changes to raise with the GP.",
  start: "2026-09-05T10:00:00+10:00",
  durationMinutes: 30,
  recurrenceFrequency: "fortnightly",
  completionMode: "manual",
};

const WOUND_DRESSING: CareEvent = {
  id: "event-margaret-wound-dressing",
  clientId: MARGARET_CLIENT_ID,
  title: "Wound dressing check",
  description:
    "Check the dressing on the left shin, change it if damp or loose, and note the condition of the wound.",
  start: "2026-10-08T10:00:00+11:00",
  durationMinutes: 30,
  recurrenceFrequency: "weekly",
  completionMode: "manual",
};

/** A title of about 100 characters (102) so list and detail layouts are exercised. */
const EYE_DROPS: CareEvent = {
  id: "event-margaret-eye-drops",
  clientId: MARGARET_CLIENT_ID,
  title:
    "Administer prescribed eye drops to both eyes, check for redness or discharge, and record it in the log",
  description:
    "Wash hands first. One drop in each eye, wait five minutes between different drops, and report redness or discharge to the nurse.",
  start: "2026-09-16T16:30:00+10:00",
  durationMinutes: 20,
  recurrenceFrequency: "weekly",
  completionMode: "manual",
};

/**
 * The plain event (CHG-009): `automatic` completion mode (PD-044), never ticked
 * off. Starts on the first day of the reference week, so it has a row on every
 * day of that week (UI-05, `PLAIN_EVENT_OCCURRENCES_BY_CLIENT_ID`).
 */
const AFTERNOON_WALK: CareEvent = {
  id: "event-margaret-walk",
  clientId: MARGARET_CLIENT_ID,
  title: "Afternoon walk",
  description: "Accompany Margaret on a short walk around the garden.",
  start: "2026-11-26T14:00:00+11:00",
  durationMinutes: 45,
  recurrenceFrequency: "daily",
  completionMode: "automatic",
};

/** Starts after the reference week, so it has no rows yet. */
const COLLECT_PRESCRIPTION: CareEvent = {
  id: "event-margaret-prescription",
  clientId: MARGARET_CLIENT_ID,
  title: "Collect prescription",
  description: "Pick up repeat prescription from the pharmacy.",
  start: "2026-12-04T11:00:00+11:00",
  durationMinutes: 20,
  recurrenceFrequency: "weekly",
  completionMode: "manual",
};

const ROBERT_MORNING_MEDS: CareEvent = {
  id: "event-robert-morning-meds",
  clientId: ROBERT_CLIENT_ID,
  title: "Morning medication",
  description: "Administer morning medication as per the current care plan.",
  start: "2026-11-29T08:30:00+11:00",
  durationMinutes: 30,
  recurrenceFrequency: "daily",
  completionMode: "manual",
};

const ROBERT_BP_CHECK: CareEvent = {
  id: "event-robert-bp-check",
  clientId: ROBERT_CLIENT_ID,
  title: "Blood pressure check",
  description: "Take Robert's blood pressure seated and record the reading.",
  start: "2026-11-30T10:00:00+11:00",
  durationMinutes: 15,
  recurrenceFrequency: "weekly",
  completionMode: "manual",
};

export const CARE_EVENTS: CareEvent[] = [
  MORNING_MEDS,
  EVENING_MEDS,
  PHYSIO,
  AFTERNOON_CHECK_IN,
  WEIGH_IN,
  MED_REVIEW,
  WOUND_DRESSING,
  EYE_DROPS,
  AFTERNOON_WALK,
  COLLECT_PRESCRIPTION,
  ROBERT_MORNING_MEDS,
  ROBERT_BP_CHECK,
];

/** One occurrence of `event`, copying its title, description and duration. */
function occurrenceOf(
  event: CareEvent,
  start: string,
  fields: Pick<Occurrence, "status"> & Partial<Occurrence>,
): Occurrence {
  return {
    key: `${event.id}:${start}`,
    eventId: event.id,
    clientId: event.clientId,
    title: event.title,
    description: event.description,
    start,
    durationMinutes: event.durationMinutes,
    ...fields,
  };
}

function doneBy(carer: string, completedAt: string) {
  return { status: "done", actor: carer, assignee: carer, completedAt } as const;
}

/**
 * Margaret's design week, Thu 26 to Mon 30 Nov 2026, exactly as drawn in
 * `family-01-home.png`, `family-07-task-log.png` and `family-08-task-detail.png`:
 * nine rows, of which Weekly weigh-in and Medication review are Overdue (no
 * nurse) and the two on Mon 30 Nov after 09:00 are Planned. Hand-written, not
 * generated. Staff names are full names (PD-038).
 */
const MARGARET_DESIGN_WEEK: Occurrence[] = [
  occurrenceOf(
    MORNING_MEDS,
    "2026-11-30T09:00:00+11:00",
    doneBy(AISHA, "2026-11-30T09:14:00+11:00"),
  ),
  occurrenceOf(PHYSIO, "2026-11-30T11:30:00+11:00", { status: "planned", assignee: AISHA }),
  occurrenceOf(AFTERNOON_CHECK_IN, "2026-11-30T15:00:00+11:00", {
    status: "planned",
    assignee: AISHA,
  }),
  occurrenceOf(
    EVENING_MEDS,
    "2026-11-29T18:00:00+11:00",
    doneBy(AISHA, "2026-11-29T18:07:00+11:00"),
  ),
  occurrenceOf(WEIGH_IN, "2026-11-29T09:30:00+11:00", { status: "overdue" }),
  occurrenceOf(PHYSIO, "2026-11-28T11:30:00+11:00", doneBy(AISHA, "2026-11-28T13:02:00+11:00")),
  occurrenceOf(MED_REVIEW, "2026-11-28T10:00:00+11:00", { status: "overdue" }),
  occurrenceOf(
    MORNING_MEDS,
    "2026-11-27T09:00:00+11:00",
    doneBy(AISHA, "2026-11-27T09:11:00+11:00"),
  ),
  occurrenceOf(
    WOUND_DRESSING,
    "2026-11-26T10:00:00+11:00",
    doneBy(AISHA, "2026-11-26T10:20:00+11:00"),
  ),
];

/** The generated history stops here (exclusive), so the design week above stays exactly nine rows. */
const HISTORY_END_EXCLUSIVE = "2026-11-26T00:00";

/** Plain-event rows run to the end of the reference day (exclusive). */
const HISTORY_END_OF_WEEK = "2026-12-01T00:00";

/**
 * 128 completed occurrences before the design week, going back to Sat 5 Sep
 * 2026 (so the daylight-saving change on Sun 4 Oct is crossed and both +10:00
 * and +11:00 offsets occur). With the design week Margaret's log is 137 rows:
 * six full pages of 20 and a last page of 17.
 */
const MARGARET_HISTORY: Occurrence[] = generateCompletedHistory(
  [
    { event: MORNING_MEDS, carers: [AISHA, FATIMA, MARCUS] },
    { event: EVENING_MEDS, carers: [SARAH, MARCUS, DANIEL] },
    { event: PHYSIO, carers: [AISHA] },
    { event: WEIGH_IN, carers: [FATIMA, SARAH] },
    { event: WOUND_DRESSING, carers: [AISHA, DANIEL] },
    { event: MED_REVIEW, carers: [FATIMA] },
    { event: EYE_DROPS, carers: TEMPORARY_CARERS },
  ],
  HISTORY_END_EXCLUSIVE,
);

/** A second client's rows, so tests can prove one client never reads another's. */
const ROBERT_OCCURRENCES: Occurrence[] = [
  occurrenceOf(
    ROBERT_MORNING_MEDS,
    "2026-11-30T08:30:00+11:00",
    doneBy(DANIEL, "2026-11-30T08:41:00+11:00"),
  ),
  occurrenceOf(ROBERT_BP_CHECK, "2026-11-30T10:00:00+11:00", {
    status: "planned",
    assignee: DANIEL,
  }),
  occurrenceOf(
    ROBERT_MORNING_MEDS,
    "2026-11-29T08:30:00+11:00",
    doneBy(MARCUS, "2026-11-29T08:39:00+11:00"),
  ),
];

/** Stored in no particular order: the contract orders them (newest first). */
export const OCCURRENCES_BY_CLIENT_ID: Record<string, Occurrence[]> = {
  [MARGARET_CLIENT_ID]: [...MARGARET_DESIGN_WEEK, ...MARGARET_HISTORY],
  [ROBERT_CLIENT_ID]: ROBERT_OCCURRENCES,
};

/**
 * Plain-event occurrences (UI-05, CHG-009): Margaret's Afternoon walk, 14:00
 * on each day of the reference week (Thu 26 to Mon 30 Nov 2026), with Aisha
 * as the assignee as on the design week's tasks. No status, actor or
 * completion time. Kept apart from `OCCURRENCES_BY_CLIENT_ID`, so the task
 * rows (and Margaret's 137-row log) are unchanged; the contract merges them
 * only when a `type` option asks for plain events (FD-01, FD-03).
 */
export const PLAIN_EVENT_OCCURRENCES_BY_CLIENT_ID: Record<string, PlainEventOccurrence[]> = {
  [MARGARET_CLIENT_ID]: generatePlainEventOccurrences(AFTERNOON_WALK, AISHA, HISTORY_END_OF_WEEK),
};

// ---------------------------------------------------------------------------
// Shifts
// ---------------------------------------------------------------------------

export const SHIFTS: Shift[] = [
  {
    id: "shift-aisha-margaret-1",
    carerId: "staff-aisha",
    clientId: MARGARET_CLIENT_ID,
    start: "2026-11-30T08:00:00+11:00",
    end: "2026-11-30T12:00:00+11:00",
  },
  {
    id: "shift-sarah-margaret-1",
    carerId: "staff-sarah",
    clientId: MARGARET_CLIENT_ID,
    start: "2026-11-30T13:00:00+11:00",
    end: "2026-11-30T17:00:00+11:00",
  },
];

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

/** PD-032: budget alert thresholds — 75% warning, 85% alert, 100% exhausted. Single configuration constant. */
export const BUDGET_THRESHOLDS = { warning: 75, alert: 85, exhausted: 100 } as const;

export function deriveBudgetBucketState(percentUsed: number): BudgetBucketState {
  if (percentUsed >= BUDGET_THRESHOLDS.exhausted) return "exhausted";
  if (percentUsed >= BUDGET_THRESHOLDS.alert) return "alert";
  if (percentUsed >= BUDGET_THRESHOLDS.warning) return "warning";
  return "ok";
}

interface RawBudgetBucket {
  kind: BudgetBucketKind;
  label: string;
  total: number;
  used: number;
}

const BUDGET_LABELS: Record<BudgetBucketKind, string> = {
  ndis: "NDIS",
  fixed: "Fixed",
  government: "Government",
};

/**
 * Raw total/used figures per client and bucket kind. `remaining`,
 * `percentUsed` and `state` are derived, never stored, so they can never
 * drift out of sync (see `deriveBudgetBucketSummary`).
 *
 * Margaret's figures match the design and AC-04 exactly: NDIS remaining
 * 14,880 of 24,000 (38% used); Fixed remaining 2,750 of 5,000 (45% used);
 * Government remaining 240 of 3,000 (92% used, alert state).
 */
export const RAW_BUDGET_BUCKETS_BY_CLIENT_ID: Record<string, RawBudgetBucket[]> = {
  [MARGARET_CLIENT_ID]: [
    { kind: "ndis", label: BUDGET_LABELS.ndis, total: 24000, used: 9120 },
    { kind: "fixed", label: BUDGET_LABELS.fixed, total: 5000, used: 2250 },
    { kind: "government", label: BUDGET_LABELS.government, total: 3000, used: 2760 },
  ],
  "client-robert": [
    { kind: "ndis", label: BUDGET_LABELS.ndis, total: 18000, used: 4000 },
    { kind: "fixed", label: BUDGET_LABELS.fixed, total: 4000, used: 1200 },
    { kind: "government", label: BUDGET_LABELS.government, total: 2500, used: 500 },
  ],
};

export function deriveBudgetBucketSummary(raw: RawBudgetBucket): BudgetBucketSummary {
  const remaining = raw.total - raw.used;
  const percentUsed = raw.total === 0 ? 0 : Math.round((raw.used / raw.total) * 100);
  return {
    kind: raw.kind,
    label: raw.label,
    total: raw.total,
    used: raw.used,
    remaining,
    percentUsed,
    state: deriveBudgetBucketState(percentUsed),
  };
}

export const FUND_ENTRIES: FundEntry[] = [
  {
    id: "fund-margaret-1",
    clientId: MARGARET_CLIENT_ID,
    bucketKind: "ndis",
    type: "topup",
    amount: 6000,
    date: "2026-11-01",
    description: "Quarterly NDIS plan top-up",
    recordedBy: "Helen Doyle",
  },
  {
    id: "fund-margaret-2",
    clientId: MARGARET_CLIENT_ID,
    bucketKind: "ndis",
    type: "expense",
    amount: -320,
    date: "2026-11-15",
    description: "Physiotherapy session",
    recordedBy: "Aisha Rahman",
  },
];

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export const DOCUMENTS: DocumentRef[] = [
  {
    id: "doc-margaret-care-plan",
    clientId: MARGARET_CLIENT_ID,
    name: "Care plan 2026.pdf",
    url: "https://example.invalid/documents/doc-margaret-care-plan",
    uploadedAt: "2026-10-01T10:00:00+11:00",
    uploadedBy: "Helen Doyle",
  },
];

/**
 * Documents attached to care events, read through `getEventDocuments` (UI-04).
 * Metadata only: opening one is a signed URL (F0-13). Physiotherapy carries
 * two (as in `family-03-edit-event.png`), Morning medication one (as in
 * `family-08-task-detail.png`); one file name is very long and one is a photo,
 * to exercise tiles.
 */
export const EVENT_DOCUMENTS: EventDocument[] = [
  {
    id: "doc-margaret-medication-chart",
    clientId: MARGARET_CLIENT_ID,
    eventId: MORNING_MEDS.id,
    name: "Medication chart.pdf",
    mimeType: "application/pdf",
    sizeBytes: 84_312,
    uploadedAt: "2026-10-12T10:15:00+11:00",
    uploadedBy: "Helen Doyle",
  },
  {
    id: "doc-margaret-physio-referral",
    clientId: MARGARET_CLIENT_ID,
    eventId: PHYSIO.id,
    name: "Physio referral.pdf",
    mimeType: "application/pdf",
    sizeBytes: 121_880,
    uploadedAt: "2026-09-02T14:20:00+10:00",
    uploadedBy: "Helen Doyle",
  },
  {
    id: "doc-margaret-exercise-plan",
    clientId: MARGARET_CLIENT_ID,
    eventId: PHYSIO.id,
    name: "Exercise plan.pdf",
    mimeType: "application/pdf",
    sizeBytes: 205_640,
    uploadedAt: "2026-09-04T09:05:00+10:00",
    uploadedBy: "Helen Doyle",
  },
  {
    id: "doc-margaret-wound-photo",
    clientId: MARGARET_CLIENT_ID,
    eventId: WOUND_DRESSING.id,
    name: "Wound photo 26 Nov.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 1_843_200,
    uploadedAt: "2026-11-26T10:22:00+11:00",
    uploadedBy: AISHA,
  },
  {
    id: "doc-margaret-eye-drops-letter",
    clientId: MARGARET_CLIENT_ID,
    eventId: EYE_DROPS.id,
    name: "Ophthalmologist letter about post-operative eye drop schedule and follow-up appointments.pdf",
    mimeType: "application/pdf",
    sizeBytes: 96_500,
    uploadedAt: "2026-09-10T11:00:00+10:00",
    uploadedBy: "Helen Doyle",
  },
  {
    id: "doc-robert-medication-chart",
    clientId: ROBERT_CLIENT_ID,
    eventId: ROBERT_MORNING_MEDS.id,
    name: "Medication chart.pdf",
    mimeType: "application/pdf",
    sizeBytes: 71_204,
    uploadedAt: "2026-10-20T09:30:00+11:00",
    uploadedBy: "Michael Hale",
  },
];

// ---------------------------------------------------------------------------
// Carer notifications
// ---------------------------------------------------------------------------

export const CARER_NOTIFICATIONS: CarerNotification[] = [
  {
    id: "notif-aisha-1",
    carerId: "staff-aisha",
    source: "admin",
    message: "New shift assigned: Margaret Doyle, Mon 30 Nov, 08:00–12:00.",
    createdAt: "2026-11-29T17:00:00+11:00",
    read: false,
  },
  {
    id: "notif-aisha-2",
    carerId: "staff-aisha",
    source: "family",
    message: "Helen Doyle added a new document: Care plan 2026.pdf.",
    createdAt: "2026-11-29T18:30:00+11:00",
    read: false,
  },
];
