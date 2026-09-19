/**
 * Design fixtures (UI-00).
 *
 * Synthetic sample data only (CLAUDE.md §12 — client data is health/
 * financial information about vulnerable people; no real names or
 * figures). Content and figures match the Figma designs at the project's
 * reference date **Monday 30 November 2026** (Australia/Melbourne).
 *
 * This module is read only by `src/mocks/queries/*` and
 * `src/mocks/current-user.ts`. It must never be imported by `src/app` or
 * `src/features` (lint-enforced, see eslint.config.mjs) — screens read
 * data through `src/server/<domain>/queries.ts` instead.
 */
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
    dob: "1950-12-05",
    suburb: "Ringwood",
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
// Care events and today's occurrences (Margaret is the fully-worked example)
// ---------------------------------------------------------------------------

export const CARE_EVENTS: CareEvent[] = [
  {
    id: "event-margaret-morning-meds",
    clientId: MARGARET_CLIENT_ID,
    title: "Morning medication",
    description:
      "Administer morning medication, record in medication log, check for side effects before leaving.",
    start: "2026-11-30T09:00:00+11:00",
    durationMinutes: 30,
    recurrenceFrequency: "daily",
    completionMode: "manual",
  },
  {
    id: "event-margaret-walk",
    clientId: MARGARET_CLIENT_ID,
    title: "Afternoon walk",
    description: "Accompany Margaret on a short walk around the garden.",
    start: "2026-11-30T14:00:00+11:00",
    durationMinutes: 45,
    recurrenceFrequency: "daily",
    completionMode: "automatic",
  },
  {
    id: "event-margaret-prescription",
    clientId: MARGARET_CLIENT_ID,
    title: "Collect prescription",
    description: "Pick up repeat prescription from the pharmacy.",
    start: "2026-11-30T11:00:00+11:00",
    durationMinutes: 20,
    recurrenceFrequency: "weekly",
    completionMode: "manual",
  },
];

export const OCCURRENCES_BY_CLIENT_ID: Record<string, Occurrence[]> = {
  [MARGARET_CLIENT_ID]: [
    {
      key: "event-margaret-morning-meds:2026-11-30T09:00:00+11:00",
      eventId: "event-margaret-morning-meds",
      clientId: MARGARET_CLIENT_ID,
      title: "Morning medication",
      description:
        "Administer morning medication, record in medication log, check for side effects before leaving.",
      start: "2026-11-30T09:00:00+11:00",
      durationMinutes: 30,
      status: "done",
      actor: "Aisha Rahman",
      assignee: "Aisha Rahman",
      completedAt: "2026-11-30T09:05:00+11:00",
    },
    {
      key: "event-margaret-prescription:2026-11-30T11:00:00+11:00",
      eventId: "event-margaret-prescription",
      clientId: MARGARET_CLIENT_ID,
      title: "Collect prescription",
      description: "Pick up repeat prescription from the pharmacy.",
      start: "2026-11-30T11:00:00+11:00",
      durationMinutes: 20,
      status: "overdue",
      assignee: undefined,
    },
    {
      key: "event-margaret-walk:2026-11-30T14:00:00+11:00",
      eventId: "event-margaret-walk",
      clientId: MARGARET_CLIENT_ID,
      title: "Afternoon walk",
      description: "Accompany Margaret on a short walk around the garden.",
      start: "2026-11-30T14:00:00+11:00",
      durationMinutes: 45,
      status: "planned",
      assignee: "Sarah Nguyen",
    },
  ],
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

/** Documents attached to care events, read through `getEventDocuments` (UI-04). */
export const EVENT_DOCUMENTS: EventDocument[] = [];

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
