# Progress — CAR-UI-01 Carer Home screen (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D4
Branch: `feature/carer-ui-home`
PR target: `carer-dev`
Last updated: 2026-09-26

## Blockers
- None for this feature. CHG-025 leaves "where carers tick off tasks" open; that blocks CAR-06, not this screen.

## Dependencies status
- F0-15 — MERGED TO DEV
- UI-03 — MERGED TO DEV

## Completed
- Claimed; scope rewritten under CHG-025 (PRD, ACs, TEST_PLAN, DECISIONS).
- Tests written first (see Tests).

## In progress
- Implementation (next session).

## Remaining
- `getCarerTodayShifts` and `getCarerNotifications` contracts + mock queries; fixture updates (FD-02).
- `/carer/home` page, `loading.tsx`, error state; screen components in `src/features/carer-home/`.
- Browser width sweep (T-13); side-by-side screenshot for the PR.

## Acceptance criteria status
- 0 / 10 MET

## Tests
- Written: 12 / 13 (T-13 is manual)
- Passing: 0
- Failing: 3 files (all fail on missing modules: route page/loading, `src/server/shifts/queries`, `src/server/notifications/queries`), the expected red state

## Files changed
- Docs: root DECISIONS.md (CHG-025), DEVELOPMENT_PLAN.md (CHG-025 notes), this feature folder.
- Tests: `src/features/carer-home/carer-home.test.tsx`, `src/server/shifts/queries.test.ts`, `src/server/notifications/queries.test.ts`.

## Decisions
- See DECISIONS.md (FD-01 to FD-04).

## Problems encountered
- None

## Assumptions
- None beyond DECISIONS.md.

## Next action
- Implement until the tests pass (see SESSION_STATE.md).

## Ready for PR
- No
