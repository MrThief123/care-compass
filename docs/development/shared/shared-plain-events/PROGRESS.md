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
2. Types (`src/types/domain.ts`) — IN PROGRESS (audit done, FD-03; tests written, failing)
3. Mocks and contracts
4. UI-01 calendar kit
5. UI-03 lists kit
6. UI-02 forms kit
7. Full verification

## Completed
- Task 1: DEVELOPMENT_PLAN.md UI-05 row and card (totals 80 features, 333 criteria); PRD.md REQ-35 "Implemented by" gains UI-05; this folder from the template.

## In progress
- Task 2: audit done (FD-03). `src/types/domain.test.ts` written first (T-01, T-02, T-03).

## Remaining
- Tasks 2 to 7.

## Acceptance criteria status
- 0 / 13 MET

## Tests
- Written: 3 / 19 (T-01, T-02, T-03 in `src/types/domain.test.ts`, 8 tests)
- Passing: 1 (the AC-06 type-level check, which holds before and after)
- Failing: 7
- Last run: 2026-09-24, `npx vitest run src/types/domain.test.ts`
- Tests-first evidence: 7 fail for the right reason before implementation: `PlainEventOccurrenceSchema`, `AnyOccurrenceSchema`, `isPlainEvent` undefined; `OccurrenceSchema` strips `kind: "event"`; `TaskLogQuerySchema` strips `type`.

## Files changed
- `DEVELOPMENT_PLAN.md`, `PRD.md`, `docs/development/shared/shared-plain-events/*`
- Planned (FD-02): `src/app/dev-preview-calendar-kit/**`, `src/app/dev-preview-forms-kit/**` (examples only)

## Decisions
- FD-01 (answered, Option A), FD-02 (answered, option a), FD-03 (answered, Option A)

## Problems encountered
- None.

## Assumptions
- `docs/JIRA_TICKETS.md`, `docs/JIRA_BACKLOG.csv` and root `SESSION_STATE.md` are not updated (as with UI-04).

## Notes for the dashboard lanes (not edited here)
- Care log (FAM-UI-07, FAM-14, FAM-15) and any log export (PL-06, PL-08): call `getTaskLog` with `type: "all"` so tasks and plain events appear together (FD-01). Today timelines that show both pass the same option to `getTodayOccurrences`.

## Next action
- Task 2: list every file on `main` that assumes every occurrence has a status and report it before changing `src/types/domain.ts`.

## Ready for PR
- No
