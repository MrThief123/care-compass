# Progress — UI-05 Plain events in the shared kit and contracts (CHG-009)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: S — Shared kit
Sprint: SPRINT · planned D8
Branch: `feature/shared-plain-events`
PR target: `main (per OQ-01 — shared work, ANSWERED PD-030)`
Last updated: 2026-09-24

## Blockers
- None. OQ-01 ANSWERED (PD-030); authorised by CHG-009; feature and plan card approved by the human in-session (2026-09-24).

**HUMAN REVIEW requested:**
1. FD-01 — ANSWERED 2026-09-24 (Option A): with no `type`, the contracts return tasks only, so existing callers and tests are unchanged. Constraint from the human: the log and any export must show tasks and plain events together, so those callers pass `type: "all"`.
2. FD-02 — ANSWERED 2026-09-24 (option a): the two shared preview pages `src/app/dev-preview-calendar-kit/` and `src/app/dev-preview-forms-kit/` may be edited to show plain-event and switch examples; nothing else under `src/app/**`.
3. FD-03 — ANSWERED 2026-09-24 (Option A): `Occurrence` stays the task occurrence (required status, optional `kind: "task"`); new `PlainEventOccurrence` (`kind: "event"`, no status/actor/completedAt); `AnyOccurrence` union and `isPlainEvent()`; contracts return `AnyOccurrence` only when a `type` option is passed.

## Dependencies status
- UI-00, UI-01, UI-02, UI-03, UI-04 — MERGED TO DEV (all on `main`)

## Task list (one at a time, human go-ahead between tasks)
1. Plan (docs only) — DONE
2. Types (`src/types/domain.ts`) — DONE
3. Mocks and contracts — DONE
4. UI-01 calendar kit — DONE
5. UI-03 lists kit — DONE
6. UI-02 forms kit — next
7. Full verification

## Completed
- Task 5: lists kit. `ActivityRow` takes `kind: "event"` (no status) and shows `EventPill` where `StatusPill` goes; task rows unchanged. Axe and token tests extended. FD-06.
- Task 4: calendar kit. `EVENT_CUE` (solid neutral stripe per CHG-010, no icon, "Event") and `occurrenceCue()` in `status-cue.ts`; new `EventPill`; `DayTimeline` / `WeekGrid` / `MonthGrid` generic over the occurrence type (default `Occurrence`); `EventPopover` shows `EventPill` for a plain event; month chips get a test id. Preview `src/app/dev-preview-calendar-kit/` shows Short walk, Garden walk, Music in the lounge and Picnic in the park as plain events (FD-02). FD-05.
- Task 3: fixtures: Afternoon walk starts Thu 26 Nov 14:00; `PLAIN_EVENT_OCCURRENCES_BY_CLIENT_ID` (5 walk rows, 26–30 Nov, assignee Aisha) via `generatePlainEventOccurrences` in `src/mocks/history.ts`. Mock adapter: `type` filter in `queryTaskLog` (status filter keeps tasks only), `getTodayOccurrences` / `getOccurrence` options. Contracts: `OccurrenceTypeOption`, overloads on `getTaskLog` / `getTodayOccurrences` / `getOccurrence`, JSDoc says the log and exports read with `type: "all"`. FD-04 (`TaskLogQuery` keeps its shape). `family-dev` compatibility checked in a scratch merge.
- Task 2: audit of every file assuming an occurrence has a status (FD-03). `src/types/domain.ts`: `occurrenceBaseShape`; `OccurrenceSchema` gains optional `kind: "task"`; `TaskOccurrence` alias; strict `PlainEventOccurrenceSchema` (`kind: "event"`); `AnyOccurrenceSchema` / `AnyOccurrence`; `isPlainEvent()`; `OccurrenceTypeFilterSchema` and `TaskLogQuerySchema.type`; `TaskLogResult<T = Occurrence>`. AC-04 reworded for FD-03 (`getOccurrence` needs `type: "all"` for a plain event).
- Task 1: DEVELOPMENT_PLAN.md UI-05 row and card (totals 80 features, 333 criteria); PRD.md REQ-35 "Implemented by" gains UI-05; this folder from the template.

## In progress
- Nothing (waiting for the go-ahead for Task 6).

## Remaining
- Tasks 6 and 7.

## Acceptance criteria status
- 9 / 13 MET (AC-01 to AC-09); AC-12 calendar and lists parts passing, forms part to come

## Tests
- Written: 14 / 19 + calendar and lists parts of T-17 / T-18 (T-14: `src/components/shared/lists/activity-row.plain-events.test.tsx`, axe in `lists-cards-kit.axe.test.tsx`; T-11 to T-13: `src/components/shared/calendar/plain-events.test.tsx`; axe: `calendar.axe.test.tsx`; tokens: `src/components/shared/plain-events.tokens.test.ts`. T-01 to T-10: `src/types/domain.test.ts`, `src/server/events/queries.plain-events.test.ts`, `src/mocks/fixtures.plain-events.test.ts`, 2 cases in `src/mocks/history.test.ts`)
- Passing: all; unit suite under `src/` 482 passed (62 files); `family-dev` + this branch 990 passed
- Failing: 5 integration tests (F0-04 / F0-07) that need a working local Supabase ("Invalid API key"); they fail identically without this change
- Last run: 2026-09-24, `npm run typecheck`, `npx vitest run src`, eslint (0 errors; 2 pre-existing warnings in `src/app/page.tsx`)
- Tests-first evidence (Task 5): commit a5164ed. The 3 plain-event `ActivityRow` tests failed (no "Event" text; the row rendered a Planned pill); the 3 task-row guards, the 2 new axe tests and the `activity-row.tsx` token test passed already (guards).
- Tests-first evidence (Task 4): commit 4b27a71. The plain-events component file failed to load (`EVENT_CUE` undefined), 3 of 4 plain-event axe tests and the `event-pill.tsx` token test failed; the popover axe test passed already (a guard). Four new accessible-name assertions were then loosened in the same task, before any existing test was touched: jsdom joins inline text without spaces ("Event:Short walk"), so `^Event: ` became `^Event:` — a bug in the new test, not a behaviour change.
- Tests-first evidence (Task 3): 12 of 23 new contract/fixture tests failed before implementation (no walk rows, `type` ignored); the 11 that passed are the AC-06 regression guards, the type-level checks, the unknown-type rejection (already by the schema) and "plain key not found without the option". Commit 553e29c. The test's query type was renamed to `TypedTaskLogQuery` with FD-04.
- Tests-first evidence (Task 2): 7 fail for the right reason before implementation: `PlainEventOccurrenceSchema`, `AnyOccurrenceSchema`, `isPlainEvent` undefined; `OccurrenceSchema` strips `kind: "event"`; `TaskLogQuerySchema` strips `type`.

## Files changed
- `DEVELOPMENT_PLAN.md`, `PRD.md`, `docs/development/shared/shared-plain-events/*`
- `src/types/domain.ts`, `src/types/domain.test.ts`
- `src/components/shared/event-pill.tsx`, `src/components/shared/calendar/{status-cue.ts,day-timeline.tsx,week-grid.tsx,month-grid.tsx,event-popover.tsx,use-event-hover.ts}`, tests `plain-events.test.tsx`, `calendar.axe.test.tsx`, `src/components/shared/plain-events.tokens.test.ts`; `src/app/dev-preview-calendar-kit/{fixtures.ts,page.tsx}` (FD-02); `src/components/shared/lists/activity-row.tsx` + `activity-row.plain-events.test.tsx`, `lists-cards-kit.axe.test.tsx`
- `src/mocks/fixtures.ts`, `src/mocks/history.ts, `src/mocks/history.test.ts`, `src/mocks/queries/events.ts`, `src/mocks/fixtures.plain-events.test.ts`, `src/server/events/queries.ts`, `src/server/events/queries.plain-events.test.ts`
- Planned (FD-02): `src/app/dev-preview-forms-kit/**` (examples only)

## Decisions
- FD-01 (answered, Option A), FD-02 (answered, option a), FD-03 (answered, Option A), FD-04, FD-05, FD-06 (implementation notes)

## Problems encountered
- Stale `.next/types` from a `family-dev` build broke `tsc` (missing pages); cleared the generated folder.
- `npm run verify` stops at `format:check` on the uncommitted `.claude/settings.json` (never committed); ran its later steps directly.
- 5 integration tests fail on a local Supabase "Invalid API key"; unrelated, same without this change.

## Assumptions
- `docs/JIRA_TICKETS.md`, `docs/JIRA_BACKLOG.csv` and root `SESSION_STATE.md` are not updated (as with UI-04).

## Notes for the dashboard lanes (not edited here)
- Care log (FAM-UI-07, FAM-14, FAM-15) and any log export (PL-06, PL-08): call `getTaskLog` with `type: "all"` so tasks and plain events appear together (FD-01). Today timelines that show both pass the same option to `getTodayOccurrences`.
- Types (FD-03): results read with a `type` option are `AnyOccurrence`; use `isPlainEvent()` before reading `status`. `Occurrence` itself is unchanged.
- Merging `main` into `family-dev` after UI-05: import-line conflicts in `src/server/events/queries.ts` and `src/mocks/queries/events.ts` (keep both sides' imports, FD-04), and a root `DECISIONS.md` conflict between CHG-009 (main) and CHG-008 (family-dev) — keep both (FD-05).
- Lists (FD-06): render a plain event as `<ActivityRow kind="event" title date onClick />`; check `isPlainEvent()` first and pass `status` / `actorName` only for tasks.
- Calendar screens that show plain events: pass `AnyOccurrence[]` (read with `type: "all"`) to `DayTimeline` / `WeekGrid` / `MonthGrid`; callbacks then receive `AnyOccurrence` (FD-05).

## Next action
- Task 6 (on go-ahead): read `src/components/shared/forms/**`, `forms-kit` axe tests, FAM-UI-03's `TaskSwitch` on `origin/family-dev`; failing `[UI-05][AC-10]` / `[AC-11]` / `[AC-12]` tests (T-15, T-16, forms part of T-17 / T-18); shared switch (`role="switch"`, 44px, On/Off words) and an `EventForm` prop to hide the Status chips; switch examples on `src/app/dev-preview-forms-kit/` (FD-02).

## Ready for PR
- No
