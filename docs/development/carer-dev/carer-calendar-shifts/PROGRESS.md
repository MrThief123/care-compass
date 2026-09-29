# Progress — CAR-05 Carer — Calendar (shifts)

Status: READY FOR PR (awaiting human approval)
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
- Human approval, then open the PR to `carer-dev`.

## Acceptance criteria status
- 10 / 10 MET

## Tests
- Written: 10 / 10 (T-01 to T-06 integration, T-07 component, T-08 and T-09 contract, T-10 regression)
- Passing: 10 / 10. Run locally 2026-09-29 (CI is down): vitest (unit), integration suite against LOCAL Supabase (18 files, 76 tests), pgTAP `supabase test db`, Playwright e2e `--grep-invert "F0-07"` (43), tsc, eslint (0 errors), prettier
- Failing: none

## Files changed
- Migration `supabase/migrations/20260929000000_carer_shifts_rpc.sql` + `supabase/tests/carer_shifts_rpc.test.sql`; `database.types.ts` (one entry, FD-06); `src/server/shifts/queries.ts`, `src/mocks/queries/shifts.ts`, `src/features/carer-home/carer-home-view.tsx`; tests: `tests/integration/carer-calendar-shifts.test.ts`, `src/server/shifts/queries.test.ts`, `src/features/carer-home/carer-home-calendar.test.tsx`, `src/features/carer-home/carer-home.test.tsx`.

## Decisions
- FD-01 to FD-04; root CHG-032.

## Assumptions
- Function takes `p_carer_id` and returns nothing unless it equals `auth.uid()` (PRD Scope).

## Next action
- Wait for the human's "yes", then open the PR "CAR-05 Carer — Calendar (shifts)"; flag the migration (FD-04) and changed test expectations (FD-03, FD-05).

## Ready for PR
- Yes, pending human approval
