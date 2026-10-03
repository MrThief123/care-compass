# Progress — ADM-11 Admin — Client view

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: A — Admin
Sprint: SPRINT · planned D19–D20
Branch: `feature/admin-client-view`
PR target: `main` (CHG-036)
Last updated: 2026-10-03

## Blockers
- None. No blocking decisions (PD-058 answered). FD-01 to FD-03 answered by the human 2026-10-03.

## Dependencies status
- ADM-04, FAM-01, FAM-04, FAM-06, FAM-07, FAM-09, FAM-10, FAM-11, FAM-14, FAM-15 — MERGED (`plan-status.mjs` lists ADM-11 as Ready to start)

## Completed
- Claimed.
- Docs reconciled with the code: PR target, `tasks` route, migration and basePath scope; FD-01 to FD-06; TEST_PLAN T-01 to T-14.

## In progress
- Tests written first (see Tests).

## Remaining
- AC-01 to AC-05: migration, admin guard, client layout and bar, routes, name links, `basePath` on two Family views.

## Acceptance criteria status
- 0 / 5 MET

## Tests
- Written: 14 / 14 planned (T-01 to T-14)
- Passing: 0
- Failing: see Results
- Last run: —
- Tests-first evidence: see Results

## Files changed
- Docs in this folder.

## Decisions
- FD-01 migration for admin event writes (flips two pgTAP assertions: HUMAN REVIEW: test expectation changed)
- FD-02 additive `basePath` on two Lane F views
- FD-03 admin not-found guard
- FD-04 route `tasks`; FD-05 client bar and nav (HUMAN REVIEW, PD-052); FD-06 no mock mode

## Problems encountered
- None

## Assumptions
- FD-04, FD-05, FD-06

## Next action
- Implement in a fresh session from the handoff prompt.

## Ready for PR
- No
