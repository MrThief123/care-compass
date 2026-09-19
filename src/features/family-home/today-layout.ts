// STUB (red-test commit): replaced by the implementation commit.
import type { Occurrence } from "@/types/domain";

export const ROW_PX = 44;
export const MIN_BLOCK_PX = 32;
export const DEFAULT_START_HOUR = 7;
export const DEFAULT_END_HOUR = 19;

export interface TimelineWindow {
  startHour: number;
  endHour: number;
}

export interface TimelineBlock {
  occurrence: Occurrence;
  top: number;
  height: number;
  startMinutes: number;
  pushed: boolean;
}

export interface TimelineHour {
  hour: number;
  top: number;
  startsEvent: boolean;
}

export interface DayLayout {
  startHour: number;
  endHour: number;
  canvasHeight: number;
  blocks: TimelineBlock[];
  hours: TimelineHour[];
  stretched: boolean;
  yAt: (minutesOfDay: number) => number | null;
}

export function timelineWindow(_occurrences: Occurrence[]): TimelineWindow {
  return { startHour: 0, endHour: 0 };
}

export function layoutDay(_occurrences: Occurrence[]): DayLayout {
  return {
    startHour: 0,
    endHour: 0,
    canvasHeight: 0,
    blocks: [],
    hours: [],
    stretched: false,
    yAt: () => null,
  };
}
