import { displayName } from "@/lib/format/display-name";

/**
 * Status of one occurrence (F0-11, REQ-17, PD-044, OQ-10, CHG-009), derived and never stored.
 *
 * - A **plain event** (`automatic`) has no status: it is never Planned, Done or Overdue and cannot
 *   be ticked off.
 * - A **task** (`manual`) is Done when its latest completion is a `done`, else Overdue once its due
 *   time has passed, else Planned. An `undone` completion puts it back to Planned or Overdue.
 * - History wins over the mode: an occurrence that has any completion was a task when it was ticked
 *   off, so switching its event to a plain event later does not change the past (CHG-009: forward
 *   only).
 */
export type CompletionMode = "manual" | "automatic";

export interface StatusSubject {
  /** The occurrence's effective start, an ISO instant with an offset. */
  start: string;
  /** The occurrence's effective mode: the event's, or its override's. */
  completionMode: CompletionMode;
}

/** The latest completion row for the occurrence, if there is one. */
export interface LatestCompletion {
  action: "done" | "undone";
  /** The full name recorded at the time (PD-038: shown in full everywhere). */
  actorDisplayName: string;
  /** ISO instant. */
  occurredAt: string;
}

export type DerivedStatus =
  | { kind: "event" }
  | { kind: "task"; status: "planned" | "overdue" }
  | { kind: "task"; status: "done"; actor: string; completedAt: string };

function toDate(value: Date | string, what: string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`deriveStatus: ${what} is not a valid date-time.`);
  }
  return date;
}

/**
 * When a task becomes Overdue: the occurrence's start (PRD: "PROPOSED: start"; ARCHITECTURE.md
 * §6 says "due time"). One function, so a later decision to use the end changes one line.
 */
export function dueTime(subject: Pick<StatusSubject, "start">): Date {
  return toDate(subject.start, "the occurrence start");
}

export function deriveStatus(
  subject: StatusSubject,
  latestCompletion: LatestCompletion | undefined,
  now: Date | string,
): DerivedStatus {
  if (subject.completionMode === "automatic" && !latestCompletion) {
    return { kind: "event" };
  }

  if (latestCompletion?.action === "done") {
    return {
      kind: "task",
      status: "done",
      actor: displayName(latestCompletion.actorDisplayName),
      completedAt: latestCompletion.occurredAt,
    };
  }

  const overdue = toDate(now, "now").getTime() >= dueTime(subject).getTime();
  return { kind: "task", status: overdue ? "overdue" : "planned" };
}
