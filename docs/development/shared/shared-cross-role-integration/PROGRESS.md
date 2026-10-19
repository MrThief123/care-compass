# Progress — INT-12 Cross-role integration journey

Status: IN PROGRESS
Owner: MrThief123
Lane: I — Integration
Sprint: SPRINT · planned D20–D21
Branch: `feature/shared-cross-role-integration`
PR target: `main` (CHG-036)
Last updated: 2026-10-03

## Blockers
- None. F0-24 (#218) and ADM-11 (#214) are merged. Note: this branch is cut from `docs/int-09-merged`, which marks ADM-11 and INT-09 merged in the plan; merge that docs PR first.

## Dependencies status
- All dependencies — MERGED

## Phase status
| Phase | Name | Status | ACs |
|---|---|---|---|
| 0 | Harness | DONE (local stack, 2026-10-03) | AC-01 to AC-03 |
| 1 | Accounts, sign-in, 2FA and passwords | NOT STARTED | AC-04 to AC-11 |
| 2 | Family core | NOT STARTED | AC-12 to AC-18 |
| 3 | Family → Admin and Carer | NOT STARTED | AC-19 to AC-23 |
| 4 | Admin → Family and Carer | NOT STARTED | AC-24 to AC-31 |
| 5 | Carer → Family and Admin | NOT STARTED | AC-32 to AC-38 |
| 6 | Organisation change | NOT STARTED | AC-39 |
| 7 | Budget emails | NOT STARTED | AC-40, AC-41 |
| 8 | Full-names sweep, whole-suite run and sign-off | NOT STARTED | AC-42 to AC-45 |

## Completed
- Feature pack written (CHG-055).
- Phase 0 — harness: `tests/e2e/int-12/support.ts`, `phase-0-harness.spec.ts`, `playwright.journey.config.ts`, `npm run test:journey`. 11 / 11 pass on the local stack; in guarded mode (hosted `.env.local`) 4 pass and 7 skip with the reason and nothing is written; after the run the database holds no `int-12-` user, profile, organisation or Margaret Carter client.

## In progress
- Nothing. Waiting for the human to say start Phase 1 (the test plan asks for a check-in between phases).

## Remaining
- Phases 1 to 8. Phase 0's manual real-Chrome walkthrough (AC-43) is part of the Phase 8 sign-off.

## Acceptance criteria status
- 3 / 45 MET (AC-01, AC-02, AC-03)

## Tests
- Written: 5 / 45 (T-01 to T-03; Phase 0)
- Passing: 5 (all Phase 0 tests; the forced-failure test passes as an expected failure)
- Failing: 0

## Defects found
- None yet.

## Files changed
- Docs in this folder.

## Decisions
- FD-01 to FD-05.

## Next action
- Phase 1 (accounts, sign-in, 2FA, passwords; AC-04 to AC-11) once the human says go.

## Ready for PR
- No
