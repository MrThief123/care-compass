/**
 * Test-support data only: the nine Task log rows exactly as drawn in
 * `docs/design/screens/family-07-task-log.png` (and the Morning medication
 * detail in `family-08-task-detail.png`), at reference date Monday 30
 * November 2026.
 *
 * Why this exists: `src/mocks/fixtures.ts` currently holds only three of
 * Margaret's occurrences, all on 30 Nov, so it cannot prove the design's
 * nine-row screen. Component tests feed these rows to the views directly.
 * This file is never imported by production code, and it is not a substitute
 * for the shared fixtures (see feature DECISIONS.md FD-02).
 *
 * Staff names are full names (PD-038, supersedes the design's "Aisha R.").
 */
import type { Occurrence } from "@/types/domain";

export const DESIGN_CLIENT_ID = "client-margaret";

const NURSE = "Aisha Rahman";

type Seed = Pick<Occurrence, "eventId" | "title" | "start" | "status"> & Partial<Occurrence>;

function occurrence(seed: Seed): Occurrence {
  return {
    key: `${seed.eventId}:${seed.start}`,
    clientId: DESIGN_CLIENT_ID,
    description: `${seed.title} as per the current care plan.`,
    durationMinutes: 60,
    ...seed,
  };
}

function done(seed: Omit<Seed, "status">): Occurrence {
  return occurrence({ ...seed, status: "done", actor: NURSE, assignee: NURSE });
}

function planned(seed: Omit<Seed, "status">): Occurrence {
  return occurrence({ ...seed, status: "planned", assignee: NURSE });
}

function overdue(seed: Omit<Seed, "status">): Occurrence {
  return occurrence({ ...seed, status: "overdue" });
}

/** Design order: newest day first; within a day, as drawn. */
export const DESIGN_TASK_LOG: Occurrence[] = [
  done({
    eventId: "event-morning-medication",
    title: "Morning medication",
    start: "2026-11-30T09:00:00+11:00",
    description:
      "Administer morning medication as per the current care plan. Confirm with Margaret before administering and record any side effects.",
    completedAt: "2026-11-30T09:14:00+11:00",
  }),
  planned({
    eventId: "event-physiotherapy",
    title: "Physiotherapy",
    start: "2026-11-30T11:30:00+11:00",
    durationMinutes: 90,
  }),
  planned({
    eventId: "event-afternoon-check-in",
    title: "Afternoon check-in",
    start: "2026-11-30T15:00:00+11:00",
  }),
  done({
    eventId: "event-evening-medication",
    title: "Evening medication",
    start: "2026-11-29T18:00:00+11:00",
    completedAt: "2026-11-29T18:07:00+11:00",
  }),
  overdue({
    eventId: "event-weekly-weigh-in",
    title: "Weekly weigh-in",
    start: "2026-11-29T09:30:00+11:00",
    durationMinutes: 15,
  }),
  done({
    eventId: "event-physiotherapy",
    title: "Physiotherapy",
    start: "2026-11-28T11:30:00+11:00",
    durationMinutes: 90,
    completedAt: "2026-11-28T13:02:00+11:00",
  }),
  overdue({
    eventId: "event-medication-review",
    title: "Medication review",
    start: "2026-11-28T14:00:00+11:00",
  }),
  done({
    eventId: "event-morning-medication",
    title: "Morning medication",
    start: "2026-11-27T09:00:00+11:00",
    completedAt: "2026-11-27T09:11:00+11:00",
  }),
  done({
    eventId: "event-wound-dressing-check",
    title: "Wound dressing check",
    start: "2026-11-26T10:00:00+11:00",
    completedAt: "2026-11-26T10:20:00+11:00",
  }),
];
