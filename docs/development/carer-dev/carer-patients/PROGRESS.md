# Progress — CAR-03 Carer — Patients

Status: TESTS WRITTEN
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D8
Branch: `feature/carer-patients`
PR target: `carer-dev`
Last updated: 2026-09-29

## Blockers
- None. OQ-09 answered (PD-041). Local Supabase (Docker) must be running for T-01, T-02, T-04, T-05 (it is, as of 2026-09-29).

## Dependencies status
- F0-06, F0-10, F0-18, CAR-UI-02 — MERGED

## Completed
- Feature docs rewritten (FD-01, FD-02): PRD, ACs, TEST_PLAN, USER_STORIES
- Tests written first and confirmed red for the right reason (see TEST_PLAN)

## In progress
- None

## Remaining
- Supabase branch of `getCarerPatients(carerId, query?)`; `name` on `CarerPatientRow` and in the mock; the query in the mock
- Page reads `?q=`; view drives the URL (debounce, Enter, clear), keeps the box on a no-match search
- Run the full suite, e2e (`--grep-invert "F0-07"`), and a preview with a real browser check

## Acceptance criteria status
- 0 / 8 MET (tests written, red)

## Tests
- Written: 10 / 10 (T-03 and T-07 already pass: built by CAR-UI-02, kept as regression)
- Passing: 2 plus the 'never widens' case in T-10
- Failing: T-01, T-02, T-04, T-05 (Supabase branch not implemented), T-06, T-08, T-09, T-10 (expected)

## Files changed
- None yet. Likely files: `src/app/(carer)/carer/patients/page.tsx`, `src/components/shared/person-card.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Implement in a fresh session: RESUME CAR-03; make the red tests green without changing them.

## Ready for PR
- No
