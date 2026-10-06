import { instantToMelbourneLocal } from "@/lib/dates/melbourne-time";
import {
  expandOccurrences,
  recurrenceWindow,
  type Occurrence as Candidate,
} from "@/lib/recurrence";
import { matchingTaskLogOccurrences } from "@/mocks/queries/events";
import {
  TASK_LOG_PAGE_SIZE,
  type AnyOccurrence,
  type TaskLogResult,
  type TypedTaskLogQuery,
} from "@/types/domain";

import {
  buildOccurrences,
  eventExpansion,
  localToIso,
  overrideForEngine,
  type BuildOccurrencesInput,
} from "./build-occurrences";

/** Exact counts with bounded ordinary-row materialisation. No persisted/result cache:
 * every invocation receives fresh rows already authorised by RLS. Completions and
 * overrides still go through the existing occurrence/status builder.
 */
export function buildTaskLog(
  input: BuildOccurrencesInput,
  query: TypedTaskLogQuery,
): TaskLogResult<AnyOccurrence> {
  const page = query.page ?? 1;
  const offset = (page - 1) * TASK_LOG_PAGE_SIZE;
  const start = instantToMelbourneLocal(input.range.from);
  const end = instantToMelbourneLocal(input.range.to);
  const needle = query.q?.trim().toLowerCase();
  // Request-local pure conversion reuse; never caches client data across reads.
  const instants = new Map<string, { iso: string; ms: number }>();
  const instant = (local: string) => {
    let value = instants.get(local);
    if (!value) {
      const iso = localToIso(local);
      value = { iso, ms: Date.parse(iso) };
      instants.set(local, value);
    }
    return value;
  };
  const selectedExceptions = new Map<string, Candidate[]>();
  const plans = input.events.map((event) => {
    const plan = eventExpansion(event, end);
    const window = recurrenceWindow(plan.rule, { start, end: plan.end });
    const overrides = input.overrides.filter((row) => row.event_id === event.id);
    const exceptional = new Set<number>();
    for (const row of [
      ...overrides,
      ...input.completions.filter((row) => row.event_id === event.id),
    ]) {
      const local = instantToMelbourneLocal(row.original_start);
      let index = window.indexOf(local);
      if (index < 0) {
        // Gap occurrences are keyed by their shifted real instant (02:30 ->
        // 03:30). Recover that original candidate only when the existing
        // converter proves it maps to exactly the stored instant.
        const beforeGap = new Date(Date.parse(local + "Z") - 3_600_000).toISOString().slice(0, 19);
        const shiftedIndex = window.indexOf(beforeGap);
        if (shiftedIndex >= 0 && instant(beforeGap).ms === Date.parse(row.original_start))
          index = shiftedIndex;
      }
      if (index >= 0) exceptional.add(index);
    }
    const exceptions: Candidate[] = [];
    const engineOverrides = overrides.map(overrideForEngine);
    for (const index of exceptional) {
      const local = window.at(index);
      const nextSecond = new Date(Date.parse(local + "Z") + 1000).toISOString().slice(0, 19);
      exceptions.push(
        ...expandOccurrences(plan.rule, { start: local, end: nextSecond }, engineOverrides),
      );
    }
    if (exceptions.length) selectedExceptions.set(event.id, exceptions);

    let from = 0;
    let to = window.count;
    const ordinaryTask = plan.eventMode === "manual";
    if (
      (needle && !event.title.toLowerCase().includes(needle)) ||
      (query.type === "events" ? ordinaryTask : query.type !== "all" && !ordinaryTask) ||
      (query.status && (!ordinaryTask || query.status === "done"))
    ) {
      to = 0;
    } else if (query.status) {
      // A rule has at most one candidate per day, so its instant sequence is
      // monotonic even across DST folds/gaps. Compare real instants, not local
      // strings: during the second folded hour a later wall time may be overdue.
      let low = 0;
      let high = to;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (instant(window.at(middle)).ms > input.now.getTime()) high = middle;
        else low = middle + 1;
      }
      if (query.status === "overdue") to = low;
      else from = low;
    }
    const count =
      to - from - [...exceptional].filter((index) => index >= from && index < to).length;
    return { event, window, exceptional, from, to, count };
  });

  const exceptionalRows = matchingTaskLogOccurrences(
    buildOccurrences(
      { ...input, events: input.events.filter((event) => selectedExceptions.has(event.id)) },
      selectedExceptions,
    ),
    query,
  );
  const total = plans.reduce((count, plan) => count + plan.count, exceptionalRows.length);
  if (offset >= total) return { items: [], page, pageSize: TASK_LOG_PAGE_SIZE, total };

  type Choice = { eventId: string; local: string; key: string; ms: number; row?: AnyOccurrence };
  const choices: Choice[] = exceptionalRows.map((row) => ({
    eventId: row.eventId,
    local: "",
    key: row.key,
    ms: Date.parse(row.start),
    row,
  }));
  const limit = offset + TASK_LOG_PAGE_SIZE;
  for (const { event, window, exceptional, from, to } of plans) {
    // At most `limit` newest ordinary candidates from any single event can
    // appear in the first `limit` global results. No earlier rows can displace them.
    let taken = 0;
    for (let index = to - 1; index >= from && taken < limit; index--) {
      if (exceptional.has(index)) continue;
      const local = window.at(index);
      const { iso, ms } = instant(local);
      choices.push({ eventId: event.id, local, key: `${event.id}:${iso}`, ms });
      taken++;
    }
  }
  choices.sort((a, b) => b.ms - a.ms || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const chosen = choices.slice(offset, offset + TASK_LOG_PAGE_SIZE);
  const selected = new Map<string, Candidate[]>();
  for (const choice of chosen) {
    if (choice.row) continue;
    const rows = selected.get(choice.eventId) ?? [];
    rows.push({ originalStart: choice.local, start: choice.local });
    selected.set(choice.eventId, rows);
  }
  const rows = buildOccurrences(
    { ...input, events: input.events.filter((event) => selected.has(event.id)) },
    selected,
  );
  const byKey = new Map(rows.map((row) => [row.key, row]));
  return {
    items: chosen.map((choice) => choice.row ?? byKey.get(choice.key)!),
    page,
    pageSize: TASK_LOG_PAGE_SIZE,
    total,
  };
}
