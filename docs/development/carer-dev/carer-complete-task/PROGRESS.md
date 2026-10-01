# Progress — CAR-06 Carer — Mark tasks done

Status: IN PROGRESS (implementation done; awaiting the human's "yes" to open the PR)
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D10
Branch: `feature/carer-complete-task`
PR target: `main`
Last updated: 2026-10-01 (implementation green)

## Blockers
- None for the build. Two human decisions pending: FD-02 (read-only Task detail for carers) and FD-07 (T-01's last step opens family Home, which needs FAM-01).
- "See it working" not done: it needs the F0-16 dev seed, which needs `supabase db reset` on the local database (denied by the sandbox; the human runs it).

## Dependencies status
- F0-10, F0-11, F0-18, CAR-UI-02, CAR-04 — all MERGED to main

## Completed
- Claimed; docs rewritten for CHG-043; tests written first (red)
- Optional `basePath` in the Family route helpers and views (home, task log, task detail, calendar, event-form return); read-only flags (`readOnly` on Home, `canEdit` on Task detail, `canAddEvent`/`canTick` on Calendar, `readOnly` on the Tasks panel)
- `loadFamilyCalendar` takes the role; the actor is the carer's full name
- Carer Home, Calendar and Care log screens, plus read-only Task detail (`tasks/[occurrenceKey]`), with loading, error and not-found states
- ViewOnlyNotice off shift on Home, Calendar and Care log; `ComingSoon` deleted

## In progress
- None

## Remaining
- Human: confirm FD-02, FD-06, FD-07; review the HUMAN REVIEW item below; approve the PR.
- Human: `supabase db reset` + dev seed, then the browser walk-through.

## HUMAN REVIEW: test expectation changed
- CAR-UI-02 AC-08 'Coming soon' holding-tab test removed (FD-04). Not in the CAR-06 test files.

## Acceptance criteria status
- 8 / 8 MET (component tests; AC-01 also e2e, see FD-07)

## Tests
- `carer-complete-task.test.tsx`: 15 / 15 pass (T-02, T-03, T-04, T-06, T-07, T-08)
- `tests/integration/carer-complete-task.test.ts`: passes (T-05)
- e2e T-01: see FD-07; AC-02 e2e passes

## Checks run (local Supabase, worktree, after merging origin/main)
- See SESSION_STATE.md

## Files changed
- `src/features/family-{home,calendar,task-log,task-detail,event-form}/*` (additive), `src/features/carer-patients/{edit-status,patient-routes}`, `src/features/family-task-log/base-path.ts`, `src/app/(carer)/carer/patients/[clientId]/{home,calendar,tasks,tasks/[occurrenceKey]}/*`

## Decisions
- See DECISIONS.md (FD-01 to FD-07)

## Problems encountered
- `getTodayOccurrences` is not implemented for Supabase (FAM-01), so Home shows its error state on real data (FD-07).

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.

## Next action
- Wait for the human's answer on the open decisions and the "yes" to open the PR.

## Ready for PR
- Awaiting human approval
