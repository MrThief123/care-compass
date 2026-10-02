import type { Occurrence } from "@/types/domain";

const MINUTE = 60_000;

function unit(count: number, name: string): string {
  return `${count} ${name}${count === 1 ? "" : "s"}`;
}

/**
 * "Completed 2 days, 3 hours late" for a Done task finished after its due time (FAM-16, PL-27).
 * The due time is the occurrence start (`dueTime`, F0-11), so lateness is elapsed whole minutes
 * from the start to `completedAt`. Under one minute, not done, no completion time, or a plain
 * event: no note. Days and hours from one day, hours and minutes from one hour, else minutes; a
 * zero part is left out.
 */
export function lateCompletionNote(
  occurrence: Partial<Pick<Occurrence, "status" | "completedAt">> & Pick<Occurrence, "start">,
): string | undefined {
  if (occurrence.status !== "done" || !occurrence.completedAt) return undefined;
  const elapsed = new Date(occurrence.completedAt).getTime() - new Date(occurrence.start).getTime();
  const total = Math.floor(elapsed / MINUTE);
  if (!(total >= 1)) return undefined;

  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const minutes = total % 60;

  const parts =
    days > 0
      ? [unit(days, "day"), hours > 0 ? unit(hours, "hour") : ""]
      : hours > 0
        ? [unit(hours, "hour"), minutes > 0 ? unit(minutes, "minute") : ""]
        : [unit(minutes, "minute")];
  return `Completed ${parts.filter(Boolean).join(", ")} late`;
}
