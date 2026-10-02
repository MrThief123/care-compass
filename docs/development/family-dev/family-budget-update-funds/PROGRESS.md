# Progress — FAM-11 Family — Update funds (Edit budget)

Status: READY FOR PR (awaiting human approval)
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D15–D16
Branch: `feature/family-budget-update-funds` (from `main`)
PR target: `main`
Last updated: 2026-10-02 (FD-07 added: event cost saved and ended plain events charged; all tests green)

## Blockers
- None. OQ-04, OQ-05, OQ-19 are ANSWERED.

## Dependencies status
- FAM-10 — MERGED TO DEV
- F0-12 — MERGED TO DEV
- FAM-UI-05 — MERGED TO DEV

## Completed
- Docs rewritten under CHG-020/021/022: PRD, ACs (8, then 12 with FD-07), USER_STORIES, TEST_PLAN (15 tests), DECISIONS (FD-01 to FD-07).
- Tests written first and confirmed failing for the right reason (see TEST_PLAN "Run record").
- Migration `20261002113224_budget_save_edit.sql` (`save_budget_edit`), `database.types.ts` regenerated, `src/server/budget/actions.ts`, `EditBudgetView` + edit page wired (`persist`).
- All FAM-11 tests green (TEST_PLAN "Results"); FAM-UI-05's tests pass unedited.

- FD-07 (human approved, 2026-10-02): event Save stores cost and bucket (`createEvent`/`updateEvent` call `set_event_cost`; form passes them); migration `20261002121815_budget_event_charge.sql` (`care_events.cost_set_at`, `charge_ended_event_occurrences`); `src/server/budget/settle.ts` runs when Budget and Family home load. 36 new tests (T-16 to T-20).

## In progress
- Nothing. Visual check done (Playwright/Chromium, production build, local Supabase): +$1,000 saved and kept after reload, over-balance refused on its field, no overlap 1920 to 768, 0 console errors.

## Remaining
- Open the PR only after the human says yes.

## Acceptance criteria status
- 12 / 12 MET (AC-09 to AC-12 added by FD-07)

## Tests
- 15 test cases in 5 files: 60 pgTAP, 26 + 9 + 6 Vitest, 1 e2e. All pass.
- HUMAN REVIEW: test expectation changed: 8 pgTAP assertions in `budget_save_edit.test.sql` were wrong when written (row counts, one message, one top-up amount); see DECISIONS FD-05. No assertion removed.
- FD-08 (scope addition): Task detail Details card, 4 new tests in `task-detail-view.details.test.tsx`. HUMAN REVIEW: test expectation changed: `page.edge.test.tsx` stubs gained `getEvent` and `getBudgetSummary`; no assertion changed.

## Files changed
- Docs: this folder.
- Tests: `supabase/tests/budget_save_edit.test.sql`, `src/server/budget/actions.test.ts`, `src/features/family-budget/edit-budget-save.test.tsx`, `tests/integration/family-budget-update-funds.test.ts`, `tests/e2e/family-budget-update-funds.spec.ts`.
- FD-07 production: `supabase/migrations/20261002121815_budget_event_charge.sql`, `src/server/budget/settle.ts`, `src/server/events/actions.ts` (events lane, human approved), `event-form-screen.tsx`, `budget-data.ts`, `home-data.ts`.
- Production: `supabase/migrations/20261002113224_budget_save_edit.sql`, `src/lib/supabase/database.types.ts`, `src/server/budget/actions.ts`, `src/features/family-budget/edit-budget-view.tsx`, `src/app/(family)/family/[clientId]/budget/edit/page.tsx`.

## Decisions
- See DECISIONS.md (FD-01 atomic save, FD-02 mock vs supabase, FD-03 errors, FD-04 no-change save, FD-05 test fixes, FD-06 history tie-break, FD-07 event cost and ended-event charge).

## Problems encountered
- The Next dev server on `127.0.0.1` does not hydrate sign-in (allowedDevOrigins), so e2e runs need a production build; the build type-checks tests, so a missing action module breaks it (a throwaway stub was used once and deleted).

## Assumptions
- Admin of the client's organisation saving through this page is allowed by the database already (REQ-38); the admin route itself is ADM-11.

## Next action
- Visual check, status page, then ask the human to approve the PR.

## Ready for PR
- Yes, pending the human's approval to open it
