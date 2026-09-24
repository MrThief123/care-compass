/**
 * Shared domain types (UI-00).
 *
 * This is the one typed contract between UI and data (PRD "Purpose"). Every
 * screen feature must read data only through `src/server/**` contract
 * functions, whose inputs/outputs are these types — never by importing
 * `src/mocks` directly (lint-enforced, see eslint.config.mjs).
 *
 * Types are defined as Zod schemas (`z.infer`) per ARCHITECTURE.md §12.4
 * ("Zod at every trust boundary") and CLAUDE.md §7 ("Zod for validation;
 * one pattern per problem") so the same schema can validate fixtures,
 * Server Action inputs and (from Phase 3) Supabase row shapes.
 *
 * Field shapes for Occurrence and BudgetBucketSummary are taken verbatim
 * from PRD.md Scope. Other types are inferred from ARCHITECTURE.md §6
 * (Data architecture) and the confirmed decisions referenced inline.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Organisation
// ---------------------------------------------------------------------------

export const OrganisationSchema = z.object({
  id: z.string(),
  name: z.string(),
  abn: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});
export type Organisation = z.infer<typeof OrganisationSchema>;

// ---------------------------------------------------------------------------
// Profile (family | carer | admin)
// ---------------------------------------------------------------------------

/** PD-042: Family is a single role with full authority for MVP. */
export const RoleSchema = z.enum(["family", "carer", "admin"]);
export type Role = z.infer<typeof RoleSchema>;

export const ProfileSchema = z.object({
  id: z.string(),
  organisationId: z.string(),
  role: RoleSchema,
  /** Store first and last name; display the full name everywhere (PD-038). */
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  /** Admin/carer only; per-organisation editable list (PD-038/OQ-13). */
  jobTitle: z.string().optional(),
  isActive: z.boolean(),
});
export type Profile = z.infer<typeof ProfileSchema>;

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export const ClientSchema = z.object({
  id: z.string(),
  organisationId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  /** ISO date (YYYY-MM-DD). */
  dob: z.string(),
  suburb: z.string().optional(),
  avatarUrl: z.string().optional(),
});
export type Client = z.infer<typeof ClientSchema>;

/** ARCHITECTURE.md §6: client_info_sections — Description / Habits / Medical history. */
export const ClientInfoSectionKindSchema = z.enum(["description", "habits", "medicalHistory"]);
export type ClientInfoSectionKind = z.infer<typeof ClientInfoSectionKindSchema>;

export const ClientInfoSectionSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  kind: ClientInfoSectionKindSchema,
  title: z.string(),
  content: z.string(),
  /** ISO datetime. */
  updatedAt: z.string(),
});
export type ClientInfoSection = z.infer<typeof ClientInfoSectionSchema>;

// ---------------------------------------------------------------------------
// Care events and occurrences
// ---------------------------------------------------------------------------

/** PD-046: full recurrence-frequency set; perpetual (no endDate) by default. */
export const RecurrenceFrequencySchema = z.enum([
  "none",
  "daily",
  "weekly",
  "fortnightly",
  "monthly",
  "every2months",
  "quarterly",
  "every6months",
  "yearly",
]);
export type RecurrenceFrequency = z.infer<typeof RecurrenceFrequencySchema>;

/** PD-044: every event has a completion mode, set once and applied to all occurrences. */
export const CompletionModeSchema = z.enum(["manual", "automatic"]);
export type CompletionMode = z.infer<typeof CompletionModeSchema>;

export const CareEventSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  /** PD-047: Title, Start time and Duration are first-class event fields. */
  title: z.string(),
  description: z.string(),
  /** ISO datetime of the first/anchor occurrence. */
  start: z.string(),
  durationMinutes: z.number().int().nonnegative(),
  recurrenceFrequency: RecurrenceFrequencySchema,
  /** ISO date; absent means the series repeats indefinitely (PD-046). */
  recurrenceEndDate: z.string().optional(),
  completionMode: CompletionModeSchema,
});
export type CareEvent = z.infer<typeof CareEventSchema>;

export const OccurrenceStatusSchema = z.enum(["planned", "done", "overdue"]);
export type OccurrenceStatus = z.infer<typeof OccurrenceStatusSchema>;

/** Fields every occurrence has, whether a task or a plain event (CHG-009). */
const occurrenceBaseShape = {
  key: z.string(),
  eventId: z.string(),
  clientId: z.string(),
  title: z.string(),
  description: z.string(),
  start: z.string(),
  durationMinutes: z.number().int().nonnegative(),
  assignee: z.string().optional(),
};

/**
 * A task occurrence: one occurrence of a `manual` event, ticked off by hand.
 *
 * PRD.md Scope, verbatim field list:
 * `{key, eventId, clientId, title, description, start, durationMinutes,
 *   status: 'planned'|'done'|'overdue', actor?, assignee?, completedAt?}`
 *
 * `key` is `${eventId}:${originalStartISO}` (ARCHITECTURE.md §6.2).
 * `assignee` (PD-029): the carer whose shift covers the occurrence start,
 * or undefined if none. `actor` (REQ-19): who actually completed it.
 * `kind` is optional so every existing task occurrence stays valid (UI-05 FD-03).
 */
export const OccurrenceSchema = z.object({
  ...occurrenceBaseShape,
  kind: z.literal("task").optional(),
  status: OccurrenceStatusSchema,
  actor: z.string().optional(),
  completedAt: z.string().optional(),
});
export type Occurrence = z.infer<typeof OccurrenceSchema>;
/** Another name for `Occurrence`, for code that handles both kinds. */
export type TaskOccurrence = Occurrence;

/**
 * A plain-event occurrence: one occurrence of an `automatic` event (CHG-009).
 * It is never ticked off, so it has no `status`, `actor` or `completedAt`, and
 * is rejected if it carries any of them. `assignee` is kept (PD-055).
 */
export const PlainEventOccurrenceSchema = z.strictObject({
  ...occurrenceBaseShape,
  kind: z.literal("event"),
});
export type PlainEventOccurrence = z.infer<typeof PlainEventOccurrenceSchema>;

/** A task occurrence or a plain-event occurrence (UI-05 FD-03). */
export const AnyOccurrenceSchema = z.union([OccurrenceSchema, PlainEventOccurrenceSchema]);
export type AnyOccurrence = Occurrence | PlainEventOccurrence;

/** The one way to tell the kinds apart; narrows to `PlainEventOccurrence`. */
export function isPlainEvent(occurrence: AnyOccurrence): occurrence is PlainEventOccurrence {
  return occurrence.kind === "event";
}

// ---------------------------------------------------------------------------
// Shifts
// ---------------------------------------------------------------------------

export const ShiftSchema = z.object({
  id: z.string(),
  carerId: z.string(),
  clientId: z.string(),
  /** ISO datetime. */
  start: z.string(),
  /** ISO datetime. */
  end: z.string(),
});
export type Shift = z.infer<typeof ShiftSchema>;

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

/** PD-033: three fixed buckets, no categories (MVP). */
export const BudgetBucketKindSchema = z.enum(["ndis", "fixed", "government"]);
export type BudgetBucketKind = z.infer<typeof BudgetBucketKindSchema>;

/** PD-032: thresholds 75% (warning) / 85% (alert) / 100% (exhausted). */
export const BudgetBucketStateSchema = z.enum(["ok", "warning", "alert", "exhausted"]);
export type BudgetBucketState = z.infer<typeof BudgetBucketStateSchema>;

/** PRD.md Scope, verbatim field list: `{kind, label, total, used, remaining, percentUsed, state}`. */
export const BudgetBucketSummarySchema = z.object({
  kind: BudgetBucketKindSchema,
  label: z.string(),
  total: z.number().nonnegative(),
  used: z.number().nonnegative(),
  remaining: z.number(),
  percentUsed: z.number().nonnegative(),
  state: BudgetBucketStateSchema,
});
export type BudgetBucketSummary = z.infer<typeof BudgetBucketSummarySchema>;

/** PD-005-consistent append-only ledger entry (top-up or expense). */
export const FundEntryTypeSchema = z.enum(["topup", "expense"]);
export type FundEntryType = z.infer<typeof FundEntryTypeSchema>;

export const FundEntrySchema = z.object({
  id: z.string(),
  clientId: z.string(),
  bucketKind: BudgetBucketKindSchema,
  type: FundEntryTypeSchema,
  amount: z.number(),
  /** ISO date. */
  date: z.string(),
  description: z.string().optional(),
  recordedBy: z.string().optional(),
});
export type FundEntry = z.infer<typeof FundEntrySchema>;

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export const DocumentRefSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  eventId: z.string().optional(),
  name: z.string(),
  url: z.string(),
  /** ISO datetime. */
  uploadedAt: z.string(),
  uploadedBy: z.string().optional(),
});
export type DocumentRef = z.infer<typeof DocumentRefSchema>;

/**
 * A document attached to a care event, as a screen reads it (UI-04, CHG-004).
 * Metadata only, mirroring the F0-13 `documents` row (`filename`, `mime_type`,
 * `size_bytes`, `uploaded_by`, `uploaded_at`, `event_id`). There is
 * deliberately no `url`: the bucket is private and a document is opened
 * through a short-lived signed URL (F0-13), never a stored link.
 */
export const EventDocumentSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  eventId: z.string(),
  /** File name as shown on the tile, e.g. "Medication chart.pdf". */
  name: z.string(),
  /** MIME type, e.g. "application/pdf". */
  mimeType: z.string(),
  /** Size in bytes. */
  sizeBytes: z.number().int().nonnegative(),
  /** ISO datetime. */
  uploadedAt: z.string(),
  uploadedBy: z.string().optional(),
});
export type EventDocument = z.infer<typeof EventDocumentSchema>;

// ---------------------------------------------------------------------------
// Carer notifications
// ---------------------------------------------------------------------------

/** PD-048: notifications trigger on shift assigned/changed/cancelled and family document/event additions. */
export const CarerNotificationSourceSchema = z.enum(["admin", "family"]);
export type CarerNotificationSource = z.infer<typeof CarerNotificationSourceSchema>;

/** PRD.md Scope, verbatim field list: `{source: 'admin'|'family', message, createdAt}`. */
export const CarerNotificationSchema = z.object({
  id: z.string(),
  carerId: z.string(),
  source: CarerNotificationSourceSchema,
  message: z.string(),
  /** ISO datetime. */
  createdAt: z.string(),
  /** Drives the unread count (PD-048); not in the PRD's literal field list but required to implement it. */
  read: z.boolean(),
});
export type CarerNotification = z.infer<typeof CarerNotificationSchema>;

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

/** PD-038/PD-039: full name display; per-organisation job title list; soft deactivation. */
export const StaffMemberSchema = z.object({
  id: z.string(),
  organisationId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  jobTitle: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  isActive: z.boolean(),
});
export type StaffMember = z.infer<typeof StaffMemberSchema>;

// ---------------------------------------------------------------------------
// Query parameter / result shapes referenced by PRD.md Scope examples
// ---------------------------------------------------------------------------

/** Rows per Task log page, one number for every data source (UI-04). */
export const TASK_LOG_PAGE_SIZE = 20;

/**
 * Input to `getTaskLog`. `page` is 1-based and must be a positive integer
 * (0, negatives, fractions, NaN and Infinity are rejected); a page past the
 * last is valid and returns no items. `q` is a trimmed, case-insensitive
 * substring of the task title; `status` is an exact match.
 *
 * `type` (UI-05, CHG-009): `all` returns tasks and plain events, `tasks` only
 * tasks, `events` only plain events. Omitted means tasks only, as before
 * (FD-01). Any `status` filter returns tasks only, since a plain event has no
 * status.
 */
export const OccurrenceTypeFilterSchema = z.enum(["all", "tasks", "events"]);
export type OccurrenceTypeFilter = z.infer<typeof OccurrenceTypeFilterSchema>;

export const TaskLogQuerySchema = z.object({
  q: z.string().optional(),
  status: OccurrenceStatusSchema.optional(),
  type: OccurrenceTypeFilterSchema.optional(),
  page: z.number().int().positive().optional(),
});
/**
 * The full validated query, including `type` (UI-05). `TaskLogQuery` keeps its
 * shape from before UI-05 (no `type`), so code written against it still reads
 * tasks only and keeps its types (FD-01, FD-03).
 */
export type TypedTaskLogQuery = z.infer<typeof TaskLogQuerySchema>;
export type TaskLogQuery = Omit<TypedTaskLogQuery, "type">;

/**
 * Longest range `getOccurrences` answers, in days: a 6×7 month grid (CHG-012).
 * A calendar never asks for more than one screen of days at a time.
 */
export const OCCURRENCE_RANGE_MAX_DAYS = 42;

const DAY_MS = 86_400_000;

/**
 * Input to `getOccurrences` (CHG-012): Melbourne calendar dates, `YYYY-MM-DD`,
 * both inclusive. `to` may not be before `from`, and the range may not be
 * longer than `OCCURRENCE_RANGE_MAX_DAYS`.
 */
export const OccurrenceRangeSchema = z
  .object({ from: z.iso.date(), to: z.iso.date() })
  .refine(({ from, to }) => from <= to, { message: "`to` is before `from`", path: ["to"] })
  .refine(
    ({ from, to }) =>
      (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS + 1 <=
      OCCURRENCE_RANGE_MAX_DAYS,
    { message: `a range may cover at most ${OCCURRENCE_RANGE_MAX_DAYS} days`, path: ["to"] },
  );
export type OccurrenceRange = z.infer<typeof OccurrenceRangeSchema>;

/**
 * One page of a client's task history, the whole history and not a window of
 * it (UI-04, CHG-004, CHG-005).
 *
 * Ordering, for every data source: newest first by `start` (instants, not
 * strings), ties broken by `key` ascending, so the order is deterministic and
 * pages never overlap or skip. `total` is the number of rows after the `q` and
 * `status` filters, across all pages. `page` echoes the requested page and
 * `pageSize` is `TASK_LOG_PAGE_SIZE`. A page beyond the last has an empty
 * `items` array and the same `total`.
 *
 * `T` is `Occurrence` by default; a read with a `type` option returns
 * `TaskLogResult<AnyOccurrence>` (UI-05 FD-03).
 */
export interface TaskLogResult<T extends AnyOccurrence = Occurrence> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
