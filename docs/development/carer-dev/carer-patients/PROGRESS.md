# Progress — CAR-03 Carer — Patients

Status: MERGED TO DEV
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D8
Branch: `feature/carer-patients`
PR target: `main` (merged in #160, 2026-09-29; CHG-036)
Last updated: 2026-09-30

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
- Human "yes", then open the PR (target per FD-06)

## Acceptance criteria status
- 8 / 8 MET

## Tests
- 10 / 10 written and passing: vitest for carer-patients and shifts (63), integration against local Supabase (7)
- Full vitest: 2053 pass; 5 fail in shared-authentication and shared-supabase-environment (F0-07/F0-04, hosted `.env.local`), identical with my changes stashed
- tsc and eslint clean on touched folders; e2e `--grep-invert "F0-07"`: 41 passed, 2 skipped
- CI is down (Actions limits): everything run locally
- Real browser (Playwright), 1920 to 768, no overlap, no horizontal scroll: mock mode (7 cards, 'Els', clear, 'zz', open a card) and `DATA_SOURCE=supabase` against a throwaway local carer (4 cards, same flow)

## Files changed
- `src/server/shifts/queries.ts`, `src/mocks/queries/shifts.ts` (Lane S), `src/app/(carer)/carer/patients/page.tsx`, `src/features/carer-patients/carer-patients-view.tsx`

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for the human's "yes", then open the PR. Flag HUMAN REVIEW: test changes (FD-03) and the Lane S mock edit.

## Ready for PR
- Yes, awaiting human approval
