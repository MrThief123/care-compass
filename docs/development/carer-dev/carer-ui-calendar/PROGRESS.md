# Progress — CAR-UI-03 Carer Calendar screen (UI)

Status: READY FOR PR
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D5–D6
Branch: `feature/carer-ui-calendar`
PR target: `carer-dev`
Last updated: 2026-09-26 (implemented; all 25 tests green)

## Blockers
- None. `/carer/patients/[clientId]` (AC-04's target) ships with CAR-UI-02 (PR #125); the link 404s in the preview until that merges to `carer-dev`.

## Dependencies status
- F0-15, UI-01, UI-03 — merged (plan-status: Ready to start)

## Completed
- Claimed (Dhruv Verma).
- CHG-030 recorded; PRD Scope, ACCEPTANCE_CRITERIA (AC-01/02 rewritten, AC-04 to AC-10 added), TEST_PLAN and DECISIONS (FD-01, FD-02) updated before implementation.
- Tests written first: `src/server/shifts/queries.test.ts` (6 new, T-07) and `src/features/carer-calendar/carer-calendar.test.tsx` (T-01 to T-06, T-08 to T-10).
- `getCarerShifts(carerId, range)` in `src/server/shifts/queries.ts` (range parsed with `OccurrenceRangeSchema`) and `src/mocks/queries/shifts.ts`; the mock's `getCarerTodayShifts` now calls it for today's one-day range.
- `/carer/calendar` page and `loading.tsx`; `src/features/carer-calendar/` view, toolbar (FD-02) and skeleton. Error state reuses `CarerHomeErrorState` (FD-03).
- Preview checked in a real browser (Playwright, the Chrome extension was not connected): week, day, month and empty views at 1920/1440/1280/1024/900/768px. No horizontal scroll, no overlap in the toolbar, block click opens `/carer/patients/client-margaret`, Next week writes `?view=week&date=2026-12-07`, no console errors. At 768px week blocks cut the time range short ("08:00–…"); the hover card shows it in full.

## In progress
- None

## Remaining
- Open the PR to `carer-dev` (after human approval).

## Acceptance criteria status
- 10 / 10 MET

## Tests
- Written: 25 (6 contract, 19 component)
- Passing: 25
- Full suite (`npm test`): 1852 passed, 12 skipped, 5 failed. All 5 are F0-07/F0-04 integration tests failing with "Invalid API key" against Supabase, not touched by this feature.
- e2e (`npm run test:e2e -- --grep-invert "F0-07"`): 36 passed.
- Lint: 0 errors (3 existing warnings in `src/app/page.tsx`). Typecheck clean. Prettier clean on changed files.

## Files changed
- DECISIONS.md (CHG-030), DEVELOPMENT_PLAN.md (CAR-UI-03 card), feature docs.
- `src/server/shifts/queries.ts`, `src/mocks/queries/shifts.ts` (outside Lane C, CHG-030, flag in PR).
- `src/app/(carer)/carer/calendar/page.tsx`, `loading.tsx`.
- `src/features/carer-calendar/carer-calendar-view.tsx`, `carer-calendar-toolbar.tsx`, `carer-calendar-skeleton.tsx`, plus the tests.

## Decisions
- See DECISIONS.md (FD-01 to FD-03) and root CHG-030.

## Problems encountered
- Stale `.next/types` from another branch broke `tsc`; fixed by the e2e `next build`, which regenerates them.

## Assumptions
- Block title is the client's first name and the kit block shows the time range, as on Carer Home (CAR-UI-01).
- Empty state copy: 'No shifts' / 'Shifts assigned to you will appear here.'
- Month chips are not clickable (the kit's `MonthGrid` chip has no select handler); a day cell does nothing. Week and day blocks open the patient.

## Next action
- Human approval, then open PR `CAR-UI-03 Carer Calendar screen (UI)` to `carer-dev`.

## Ready for PR
- Yes
