# Progress — CAR-06 Carer — Mark tasks done

Status: MERGED TO DEV (merged to `main` in #183, 2026-10-01)
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
- None — merged.

## Ready for PR
- Merged in #183.

## Real-browser check (2026-10-01, local Supabase, F0-16 seed; Margaret's and Robert's events moved to today locally)
- Aisha: /carer/patients shows Margaret 'On shift', Robert 'View only'.
- Margaret Calendar: 4 tick boxes, no Add event link; Physiotherapy stays ticked after a reload.
- Margaret Home: no tick boxes, no Enter event, no View breakdown. On real data Home shows its error state until FAM-01 (FD-07).
- Margaret Care log: rows open the read-only Task detail (no Edit event).
- Robert Calendar: tasks visible, no checkboxes, view-only notice.
- Helen: /family/<margaretId>/calendar shows 'Done · Aisha Rahman'; no /carer/ links; Family links unchanged.
- Width sweep 1920/1440/1280/1024/768 on Calendar and Home: no horizontal scroll, nothing overlapping (the only rect overlaps are hour labels clipped inside the calendar's scroll area).

## Pre-PR checks (2026-10-01, after merging origin/main with FAM-01; all against LOCAL Supabase)
- `npx tsc --noEmit`: clean. `npm run lint`: 0 errors, 2 import-order warnings.
- `npx vitest run` (clean F0-16 seed): 2428 of 2429 pass; the one failure (a lint-boundary test) timed out under load and passes alone (3/3).
- `supabase test db`: 512 tests pass.
- `npm run build`, then e2e with `E2E_DATA_SOURCE=supabase` for `carer-complete-task` and `carer-client-info`: 6 passed (T-01 now passes; FAM-01 gives Family Home real data).
- e2e in mock mode with `--grep-invert "F0-07|CAR-0[46]"`: 53 passed, 3 skipped (admin MFA).
- Note: e2e serves `npm run start`, so rebuild after merging or the old build is tested.
- Carer Home on real data now loads (FD-07 resolved by FAM-01).
