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
3. Mocks and contracts — next
4. UI-01 calendar kit
5. UI-03 lists kit
6. UI-02 forms kit
7. Full verification

## Completed
- Task 2: audit of every file assuming an occurrence has a status (FD-03). `src/types/domain.ts`: `occurrenceBaseShape`; `OccurrenceSchema` gains optional `kind: "task"`; `TaskOccurrence` alias; strict `PlainEventOccurrenceSchema` (`kind: "event"`); `AnyOccurrenceSchema` / `AnyOccurrence`; `isPlainEvent()`; `OccurrenceTypeFilterSchema` and `TaskLogQuerySchema.type`; `TaskLogResult<T = Occurrence>`. AC-04 reworded for FD-03 (`getOccurrence` needs `type: "all"` for a plain event).
- Task 1: DEVELOPMENT_PLAN.md UI-05 row and card (totals 80 features, 333 criteria); PRD.md REQ-35 "Implemented by" gains UI-05; this folder from the template.

## In progress
- Nothing (waiting for the go-ahead for Task 3).

## Remaining
- Tasks 3 to 7.

## Acceptance criteria status
- 2 / 13 MET (AC-01, AC-02)

## Tests
- Written: 3 / 19 (T-01, T-02, T-03 in `src/types/domain.test.ts`, 8 tests)
- Passing: 8 / 8 in `src/types/domain.test.ts`; full unit suite 432 passed
- Failing: 5 integration tests (F0-04 / F0-07) that need a working local Supabase ("Invalid API key"); they fail identically without this change
- Last run: 2026-09-24, `npm run typecheck`, `npx prettier --check src docs`, `npm test`
- Tests-first evidence: 7 fail for the right reason before implementation: `PlainEventOccurrenceSchema`, `AnyOccurrenceSchema`, `isPlainEvent` undefined; `OccurrenceSchema` strips `kind: "event"`; `TaskLogQuerySchema` strips `type`.

## Files changed
- `DEVELOPMENT_PLAN.md`, `PRD.md`, `docs/development/shared/shared-plain-events/*`
- `src/types/domain.ts`, `src/types/domain.test.ts`
- Planned (FD-02): `src/app/dev-preview-calendar-kit/**`, `src/app/dev-preview-forms-kit/**` (examples only)

## Decisions
- FD-01 (answered, Option A), FD-02 (answered, option a), FD-03 (answered, Option A)

## Problems encountered
- Stale `.next/types` from a `family-dev` build broke `tsc` (missing pages); cleared the generated folder.
- `npm run verify` stops at `format:check` on the uncommitted `.claude/settings.json` (never committed); ran its later steps directly.
- 5 integration tests fail on a local Supabase "Invalid API key"; unrelated, same without this change.

## Assumptions
- `docs/JIRA_TICKETS.md`, `docs/JIRA_BACKLOG.csv` and root `SESSION_STATE.md` are not updated (as with UI-04).

## Notes for the dashboard lanes (not edited here)
- Care log (FAM-UI-07, FAM-14, FAM-15) and any log export (PL-06, PL-08): call `getTaskLog` with `type: "all"` so tasks and plain events appear together (FD-01). Today timelines that show both pass the same option to `getTodayOccurrences`.
- Types (FD-03): results read with a `type` option are `AnyOccurrence`; use `isPlainEvent()` before reading `status`. `Occurrence` itself is unchanged.

## Next action
- Task 3 (on go-ahead): failing contract/fixture tests T-04 to T-08 (AC-03 to AC-06), then fixtures, mock adapter and `src/server/events/queries.ts` options.

## Ready for PR
- No
