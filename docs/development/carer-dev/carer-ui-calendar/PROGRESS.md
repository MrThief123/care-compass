# Progress — CAR-UI-03 Carer Calendar screen (UI)

Status: READY FOR PR
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D5–D6
Branch: `feature/carer-ui-calendar`
PR target: `carer-dev`
Last updated: 2026-09-26 (CHG-031: calendar merged into Carer Home; green)

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
- **CHG-031:** calendar merged into Carer Home (Day by default, notifications beside it from 1280px, below under that); `/carer/calendar` route and `src/features/carer-calendar/` deleted, no redirect; Carer rail Calendar item removed from `src/components/shared/nav-config.ts`. Tests rewritten first (red, commit `777fb08`), then implemented (FD-04 lists every test change).
- CHG-031 preview (Playwright): Home in day, week, month and empty views at 1920/1440/1280/1024/900/768px. No horizontal scroll, no toolbar or card overlap; notifications beside the calendar at 1280px and up, below it at 1024px and under. Rail shows Home, Patients, Settings; Next day writes `?view=day&date=2026-12-01`; a week block opens `/carer/patients/client-margaret`; `/carer/calendar` returns 404; no console errors. At 1280px (calendar ~690px wide) week blocks cut the time range short ("08:00–1…"), as at 768px before.
- Earlier preview of `/carer/calendar`, before CHG-031, checked in a real browser (Playwright, the Chrome extension was not connected): week, day, month and empty views at 1920/1440/1280/1024/900/768px. No horizontal scroll, no overlap in the toolbar, block click opens `/carer/patients/client-margaret`, Next week writes `?view=week&date=2026-12-07`, no console errors. At 768px week blocks cut the time range short ("08:00–…"); the hover card shows it in full.

## In progress
- None

## Remaining
- Open the PR to `carer-dev` (after human approval).

## Acceptance criteria status
- 10 / 10 MET

## Tests
- Written: 26 (6 contract, 20 component in `carer-home-calendar.test.tsx`), plus the changed CAR-UI-01 and F0-15 tests (FD-04)
- Passing: all
- Full suite (`npm test`): 1853 passed, 12 skipped, 5 failed. All 5 are F0-07/F0-04 integration tests failing with "Invalid API key" against Supabase, not touched by this feature.
- e2e (`npm run test:e2e -- --grep-invert "F0-07"`): 36 passed.
- Lint: 0 errors (3 existing warnings in `src/app/page.tsx`). Typecheck clean. Prettier clean on changed files.

## Files changed
- DECISIONS.md (CHG-030, CHG-031), DEVELOPMENT_PLAN.md (CAR-UI-03, CAR-05 cards), feature docs, CAR-UI-01 and F0-15 ACCEPTANCE_CRITERIA notes.
- `src/server/shifts/queries.ts`, `src/mocks/queries/shifts.ts` (outside Lane C, CHG-030, flag in PR).
- `src/components/shared/nav-config.ts`, `src/components/shared/rail.test.tsx`, `tests/e2e/shared-app-shell.spec.ts` (outside Lane C, CHG-031, flag in PR).
- `src/app/(carer)/carer/home/page.tsx`; `src/features/carer-home/carer-home-view.tsx`, `carer-shifts-toolbar.tsx`, `carer-home-skeleton.tsx`, `carer-home.test.tsx`, `carer-home-calendar.test.tsx`.

## Decisions
- See DECISIONS.md (FD-01 to FD-05) and root CHG-030, CHG-031.
- **HUMAN REVIEW: test expectation changed** (CHG-031, FD-04).

## Calendar size and scrollable notifications (FD-05, 2026-09-26)
- Day, Week, Month and the empty state share one 640px body (card 748px at every width); Notifications matches the calendar card from 1280px and its list scrolls.
- Checks: full suite 1853 passed, same 5 unrelated F0-07/F0-04 failures; e2e 36 passed; lint and typecheck clean.
- Playwright sweep 1920/1440/1280/1024/900/768 x day/week/month/empty: no horizontal scroll, nothing spilling out of the box, no month cell clipped; a 28-item list scrolls (678 of 1164px shown) and PageDown scrolls it when focused.

## Problems encountered
- Stale `.next/types` from another branch broke `tsc`; fixed by the e2e `next build`, which regenerates them.

## Assumptions
- Block title is the client's first name and the kit block shows the time range, as on Carer Home (CAR-UI-01).
- Empty state copy: 'No shifts' / 'Shifts assigned to you will appear here.'
- Month chips are not clickable (the kit's `MonthGrid` chip has no select handler); a day cell does nothing. Week and day blocks open the patient.

## Next action
- Human approval, then open PR `CAR-UI-03 Carer Calendar screen (UI)` to `carer-dev`, flagging CHG-030 and CHG-031 edits outside Lane C and the changed tests.

## Ready for PR
- Yes
