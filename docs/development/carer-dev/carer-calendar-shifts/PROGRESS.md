# Progress — CAR-05 Carer — Calendar (shifts)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D9–D10
Branch: `feature/carer-calendar-shifts`
PR target: `carer-dev`
Last updated: 2026-09-29

## Blockers
- None. OQ-33 answered. Local Supabase (Docker) must be running to execute T-01 to T-06 (it is, as of 2026-09-29).

## Dependencies status
- F0-10, F0-18 — merged. CAR-UI-03, CAR-UI-01 — merged to `carer-dev`.

## Completed
- Claimed (Dhruv Verma); branch from `carer-dev`.
- Questions answered by the human (FD-02); CHG-032 recorded in root DECISIONS.md.
- PRD, ACCEPTANCE_CRITERIA, TEST_PLAN, USER_STORIES, DECISIONS rewritten (FD-01).
- Tests written first (see Tests).

## In progress
- None. Stopped after the tests, as asked.

## Remaining
- Migration `get_carer_shifts`, regenerate DB types.
- Supabase branch of `getCarerShifts`; rename `clientFirstName` to `clientName`; update `carer-home-view.tsx` and the mock.
- Run all suites, check Carer Home in a real browser (Supabase mode and mock), update docs, ask before opening the PR.

## Acceptance criteria status
- 0 / 10 MET

## Tests
- Written: 10 / 10 (T-01 to T-06 integration, T-07 component, T-08 and T-09 contract, T-10 regression)
- Passing: 0 (new tests red for the expected reasons; T-01 to T-06 verified red against local Supabase 2026-09-29)
- Failing: see TEST_PLAN.md

## Files changed
- Docs only plus tests: `tests/integration/carer-calendar-shifts.test.ts`, `src/server/shifts/queries.test.ts`, `src/features/carer-home/carer-home-calendar.test.tsx`, `src/features/carer-home/carer-home.test.tsx`.

## Decisions
- FD-01 to FD-04; root CHG-032.

## Assumptions
- Function takes `p_carer_id` and returns nothing unless it equals `auth.uid()` (PRD Scope).

## Next action
- Implementation session from the prompt handed to the human.

## Ready for PR
- No
