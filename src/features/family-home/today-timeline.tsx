// STUB (red-test commit): replaced by the implementation commit.
import type { Occurrence } from "@/types/domain";

export interface TodayTimelineProps {
  clientId: string;
  occurrences: Occurrence[];
  /** Pins the current-time line (tests); omit to track the real clock, `null` for no line. */
  now?: Date | null;
}

export function TodayTimeline(_props: TodayTimelineProps) {
  return null;
}
