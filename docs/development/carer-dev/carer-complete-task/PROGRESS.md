# Progress — CAR-06 Carer — Mark tasks done

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D10
Branch: `feature/carer-complete-task`
PR target: `main`
Last updated: 2026-10-01 (claimed)

## Blockers
- None. OQ-09, OQ-10, OQ-33 ANSWERED. Awaiting human confirmation of FD-02 (read-only Task detail for carers).

## Dependencies status
- F0-10, F0-11, F0-18, CAR-UI-02, CAR-04 — all MERGED to main

## Completed
- Claimed; docs rewritten for CHG-043; tests written first (red)

## In progress
- None

## Remaining
- Implementation: base path and read-only flags in the family modules, carer Calendar/Home/Care log/Task detail routes, role-aware loaders, read-only Tasks panel, full-name actor.

## Acceptance criteria status
- 0 / 8 MET

## Tests
- Written: 8 / 8 (T-05 integration and T-01 e2e need local Supabase)
- Passing: T-08 only (regression guard). Failing: the rest, as expected.

## Files changed
- Docs only so far, plus the three test files. Likely implementation files: `src/features/family-{home,calendar,task-log,task-detail,event-form}/*`, `src/features/carer-patients/*`, `src/app/(carer)/carer/patients/[clientId]/{home,calendar,tasks}/**`.

## Decisions
- See DECISIONS.md

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Implement against the red tests, in a fresh session (see SESSION_STATE.md).

## Ready for PR
- No
