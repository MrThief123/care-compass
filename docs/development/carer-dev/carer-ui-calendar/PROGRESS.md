# Progress — CAR-UI-03 Carer Calendar screen (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D5–D6
Branch: `feature/carer-ui-calendar`
PR target: `carer-dev`
Last updated: 2026-09-26 (docs rewritten for CHG-025/CHG-030; tests written, red)

## Blockers
- None. `/carer/patients/[clientId]` (AC-04's target) ships with CAR-UI-02 (PR #125); the link 404s in the preview until that merges to `carer-dev`.

## Dependencies status
- F0-15, UI-01, UI-03 — merged (plan-status: Ready to start)

## Completed
- Claimed (Dhruv Verma).
- CHG-030 recorded; PRD Scope, ACCEPTANCE_CRITERIA (AC-01/02 rewritten, AC-04 to AC-10 added), TEST_PLAN and DECISIONS (FD-01, FD-02) updated before implementation.
- Tests written first: `src/server/shifts/queries.test.ts` (6 new, T-07) and `src/features/carer-calendar/carer-calendar.test.tsx` (T-01 to T-06, T-08 to T-10).

## In progress
- None

## Remaining
- `getCarerShifts(carerId, range)` in `src/server/shifts/queries.ts` + `src/mocks/queries/shifts.ts` (flag in PR: outside Lane C, CHG-030).
- `src/app/(carer)/carer/calendar/page.tsx` and `loading.tsx`; `src/features/carer-calendar/` view, toolbar (FD-02), skeleton, error state.
- Green, full suite, e2e (`--grep-invert "F0-07"`), preview + browser width sweep 1920→768, side-by-side screenshot.

## Acceptance criteria status
- 0 / 10 MET

## Tests
- Written: 27 (6 contract, 21 component)
- Passing: 0
- Failing: 27 — red for the expected reason: `TypeError: getCarerShifts is not a function` (contract); `Failed to resolve import "@/app/(carer)/carer/calendar/loading"` (screen file, route not built yet). The 6 existing CAR-UI-01 contract tests still pass.

## Files changed
- DECISIONS.md (CHG-030), DEVELOPMENT_PLAN.md (CAR-UI-03 card), feature docs, the two test files above.

## Decisions
- See DECISIONS.md (FD-01, FD-02) and root CHG-030.

## Problems encountered
- None

## Assumptions
- Block title is the client's first name and the kit block shows the time range, as on Carer Home (CAR-UI-01).
- Empty state copy: 'No shifts' / 'Shifts assigned to you will appear here.'
- Error state reuses the Carer Home look ('Something went wrong', 'Try again').

## Next action
- Implement `getCarerShifts`, then the screen, until the 27 tests pass.

## Ready for PR
- No
