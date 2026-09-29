# Progress — FAM-05 Family Calendar — Tasks panel and Log panel

Status: MERGED TO DEV
Owner: MrThief123
Lane: F — Family
Sprint: SPRINT · planned D9
Branch: `feature/family-calendar-tasks-log`
PR target: `family-dev` — merged as PR #137 directly to `main` (`family-dev` is behind `main`
and no longer the merge target in practice; see root PROGRESS.md)
Last updated: 2026-09-27

**FD-01 (undo scope) merged as implemented.** Flagged for human review before merge; the PR
was merged with the undo/unticking wiring in place, so the scope reading in DECISIONS.md FD-01
stands as accepted. Recorded here for traceability, not as an open item.

## Blockers
- None — OQ-10 is ANSWERED (root DECISIONS.md).

## Dependencies status
- F0-11 — MERGED TO DEV
- FAM-UI-02 — MERGED TO DEV

## Completed
- Traced the gap: FAM-UI-02 already built the Tasks panel checklist, Log panel and optimistic
  tick display (`apply-ticks.ts`), explicitly deferring persistence to FAM-05 (its own doc
  comment says so). AC-03 and AC-04 (subtitle/listing, Log panel content) were already met by
  the existing rendering, reading through `getTaskLog` (Supabase-wired by FAM-02).
- Added the Supabase branch of `setOccurrenceDone` (`set_occurrence_done` RPC) and a new
  `setOccurrenceUndone` action (`set_occurrence_undone` RPC) in `src/server/events/actions.ts`,
  with Zod-validated occurrence-key parsing and mapped error codes (NOT_ALLOWED/NOT_FOUND/
  UNEXPECTED), following the existing `changeClientOrganisation` action's pattern.
- Added a matching mock mutation `setOccurrenceUndone` (`src/mocks/queries/events.ts`) so the
  real action round-trip works under `DATA_SOURCE=mock` too (Playwright e2e, dev preview).
- Wired `family-calendar-view.tsx`'s tick handler: applies the tick optimistically (unchanged,
  CHG-016), calls the action, reverts and shows an inline error on failure (AC-02). Added an
  `errorMessage` prop to `TasksPanel` (`role="status"`, screen-reader announced).
- Wrote FAM-05-labelled tests for all 4 ACs plus undo cases; updated one pre-existing
  `[FAM-UI-02][AC-08]` test whose assertion ("nothing is saved") FAM-05 makes false (FD-02).
- New integration suite against local Supabase: real persistence with actor recorded (AC-01),
  undo appending an 'undone' row, an RLS negative case, and a validation case.
- Ran the existing `family-calendar` Playwright e2e suite (10/10 pass) to confirm no regression
  to the optimistic tick/untick UI under `DATA_SOURCE=mock`.

## In progress
- None

## Remaining
- None in FAM-05's scope (pending the HUMAN REVIEW above on the undo decision).

## Acceptance criteria status
- 4 / 4 MET

## Tests
- Written: 10 (T-01–T-04 plus 2 undo component cases, 2 undo/RLS/validation integration cases,
  1 pre-existing test updated)
- Passing: all (`npx vitest run src/features/family-calendar src/mocks src/server/events` and
  `tests/integration/family-calendar-tasks-log.test.ts` with local Supabase env; full suite,
  `npm run verify`, and Playwright e2e also green)
- Failing: 0

## Files changed
- `src/server/events/actions.ts` — Supabase branch for `setOccurrenceDone`, new `setOccurrenceUndone`
- `src/mocks/queries/events.ts` — new mock `setOccurrenceUndone`
- `src/features/family-calendar/family-calendar-view.tsx` — `toggleTick`, error state
- `src/features/family-calendar/tasks-panel.tsx` — `errorMessage` prop
- `src/features/family-calendar/family-calendar.test.tsx` — FAM-05 tests, one FD-02 relabel
- `tests/integration/family-calendar-tasks-log.test.ts` — new, FAM-05 integration suite

## Decisions
- See DECISIONS.md (FD-01 — HUMAN REVIEW requested, FD-02 — test expectation change)

## Problems encountered
- A stale `next start` process left over from an earlier Playwright e2e run on this machine
  (different branch's build) caused 6 spurious e2e failures on the first run; killing it and
  letting Playwright's `webServer` start its own fixed that — not a code regression.

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.
- The error copy "Couldn't save. Please try again." is PRD.md's own PROPOSED text.

## Next action
- None — merged (PR #137).

## Ready for PR
- Merged.
