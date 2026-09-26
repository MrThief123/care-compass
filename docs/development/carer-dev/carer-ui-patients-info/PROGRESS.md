# Progress — CAR-UI-02 Carer Patients and patient info screens (UI)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D4–D5
Branch: `feature/carer-ui-patients-info`
PR target: `carer-dev`
Last updated: 2026-09-26 (claimed)

## Blockers
- None. Lane F request (FD-01) blocks only CAR-04's wiring of the Home, Calendar and Care log tabs, not this feature.

## Dependencies status
- F0-15 — MERGED · UI-03 — MERGED · CAR-UI-01 (PR #124) — MERGED to carer-dev

## Completed
- Claimed (2026-09-26).
- Docs updated for CHG-026 and CHG-028 (human answers 2026-09-26: split scope; carer rail + patient tabs; branch from carer-dev after #124 merged): PRD Scope, 13 ACs, TEST_PLAN, FD-01 to FD-04, root DECISIONS CHG-028, DEVELOPMENT_PLAN card note.
- Tests written first: `src/features/carer-patients/carer-patients.test.tsx` (component, T-01 to T-12) and `getCarerPatients` block in `src/server/shifts/queries.test.ts` (T-13). Red run 2026-09-26: component file fails to resolve `@/app/(carer)/carer/patients/[clientId]/calendar/page` (routes not built); contract tests fail with `getCarerPatients is not a function`. Both expected.

## In progress
- None

## Remaining
- Implement per SESSION_STATE.md "Exact next action".

## Acceptance criteria status
- 0 / 13 MET

## Tests
- Written: 13 / 13 test IDs (37 cases)
- Passing: 0 new
- Failing: all new (expected red)

## Files changed
- Docs above; the two test files.

## Decisions
- See DECISIONS.md (FD-01 to FD-04). HUMAN REVIEW in PR: `src/mocks/**` edited from Lane C (FD-02).

## Problems encountered
- None

## Next action
- Implement until green (new session).

## Ready for PR
- No
