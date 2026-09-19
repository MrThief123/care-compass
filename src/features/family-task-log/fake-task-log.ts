/**
 * Test-support only (never imported by production code; the same status as
 * `design-fixtures.ts`). Generates realistic, large task histories and a
 * stand-in for the `getTaskLog` contract, so tests never rest on the handful
 * of sample rows in `src/mocks` (CHG-005, DECISIONS.md FD-12).
 *
 * The double follows the contract's documented shape (`TaskLogResult`) and the
 * mock's paging (page size 20, `q` matches the title case-insensitively,
 * `status` filters, rows come back in the order given, i.e. newest first). It
 * differs from the mock in one deliberate way: it THROWS for a page that is not
 * a whole number >= 1, where the mock quietly returns wrong rows. That makes a
 * test fail if the screen ever forwards an unvalidated page.
 */
import type { TaskLogQueryInput } from "@/server/events/queries";
import type { Occurrence, OccurrenceStatus, TaskLogResult } from "@/types/domain";

export const CONTRACT_PAGE_SIZE = 20;

/** `text` repeated and cut to exactly `length` characters. */
export function exactly(text: string, length: number): string {
  return text.repeat(Math.ceil(length / text.length)).slice(0, length);
}

export const TITLE_120 = exactly(
  "Wound dressing check and medication review with the visiting nurse ",
  120,
);
export const NAME_60 = exactly("Alexandrina Featherstonehaugh-Rahman Winterbottom-Prendergast", 60);

const TITLES = [
  "Morning medication",
  "Physiotherapy",
  "Afternoon check-in",
  "Evening medication",
  "Weekly weigh-in",
  "Medication review",
  "Wound dressing check",
  "Collect prescription",
];

/** Accents, CJK, emoji with a ZWJ sequence, right-to-left, German umlaut. */
export const NON_ASCII_TITLES = [
  "Médicament du matin — révision",
  "朝の投薬の確認",
  "Physio 🏃‍♀️ après-midi",
  "فحص الدواء الصباحي",
  "Überprüfung der Medikation",
];

const NAMES = [
  "Aisha Rahman",
  "Sarah Nguyen",
  "Daniel K.",
  "Nguyễn Thị Hồng Ánh",
  "Zoë O'Brien-Łukasiewicz",
  NAME_60,
];

const STATUS_CYCLE: OccurrenceStatus[] = ["done", "done", "planned", "overdue", "done"];
const TIMES = ["15:00", "11:30", "09:00"];

export interface HistoryOptions {
  /** Force the title of the row at this index (0 is the newest), e.g. to plant a search needle deep in the history. */
  titleAt?: Record<number, string>;
  clientId?: string;
}

/**
 * `count` occurrences, newest first, three a day counting back from Monday 30
 * November 2026. Every 7th title is exactly 120 characters, every 11th is
 * non-ASCII, and the people cycle through names up to 60 characters. Keys are
 * unique.
 */
export function makeHistory(count: number, options: HistoryOptions = {}): Occurrence[] {
  const { titleAt = {}, clientId = "client-margaret" } = options;
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(Date.UTC(2026, 10, 30 - Math.floor(index / 3)));
    const date = day.toISOString().slice(0, 10);
    const start = `${date}T${TIMES[index % 3]}:00+11:00`;
    const title =
      titleAt[index] ??
      (index % 7 === 3
        ? TITLE_120
        : index % 11 === 5
          ? NON_ASCII_TITLES[index % NON_ASCII_TITLES.length]!
          : TITLES[index % TITLES.length]!);
    const status = STATUS_CYCLE[index % STATUS_CYCLE.length]!;
    const person = NAMES[index % NAMES.length]!;
    const eventId = `event-${index % 13}`;

    return {
      key: `${eventId}:${start}`,
      eventId,
      clientId,
      title,
      description: `Care instructions for ${title}.`,
      start,
      durationMinutes: 30,
      status,
      ...(status === "done" ? { actor: person, assignee: person, completedAt: start } : {}),
      ...(status === "planned" ? { assignee: person } : {}),
    };
  });
}

/** A stand-in for `getTaskLog` over `all` (see the file comment for how it differs from the mock). */
export function fakeTaskLog(all: Occurrence[], pageSize: number = CONTRACT_PAGE_SIZE) {
  return async (_clientId: string, query: TaskLogQueryInput = {}): Promise<TaskLogResult> => {
    const { q, status, page = 1 } = query;
    if (!Number.isInteger(page) || page < 1) {
      throw new Error(`fake getTaskLog: invalid page ${String(page)}`);
    }
    const needle = q?.trim().toLowerCase();
    const matching = all.filter(
      (occurrence) =>
        (!status || occurrence.status === status) &&
        (!needle || occurrence.title.toLowerCase().includes(needle)),
    );
    const from = (page - 1) * pageSize;
    return {
      items: matching.slice(from, from + pageSize),
      page,
      pageSize,
      total: matching.length,
    };
  };
}
