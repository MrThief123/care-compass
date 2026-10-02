# Progress — FAM-11 Family — Update funds (Edit budget)

Status: READY FOR PR (awaiting human approval)
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D15–D16
Branch: `feature/family-budget-update-funds` (from `main`)
PR target: `main`
Last updated: 2026-10-02 (implemented; all FAM-11 tests green; visual check next)

## Blockers
- None. OQ-04, OQ-05, OQ-19 are ANSWERED.

## Dependencies status
- FAM-10 — MERGED TO DEV
- F0-12 — MERGED TO DEV
- FAM-UI-05 — MERGED TO DEV

## Completed
- Docs rewritten under CHG-020/021/022: PRD, ACs (8), USER_STORIES, TEST_PLAN (15 tests), DECISIONS (FD-01 to FD-05).
- Tests written first and confirmed failing for the right reason (see TEST_PLAN "Run record").
- Migration `20261002113224_budget_save_edit.sql` (`save_budget_edit`), `database.types.ts` regenerated, `src/server/budget/actions.ts`, `EditBudgetView` + edit page wired (`persist`).
- All FAM-11 tests green (TEST_PLAN "Results"); FAM-UI-05's tests pass unedited.

## In progress
- Nothing. Visual check done (Playwright/Chromium, production build, local Supabase): +$1,000 saved and kept after reload, over-balance refused on its field, no overlap 1920 to 768, 0 console errors.

## Remaining
- Open the PR only after the human says yes.

## Acceptance criteria status
- 8 / 8 MET

## Tests
- 15 test cases in 5 files: 60 pgTAP, 26 + 9 + 6 Vitest, 1 e2e. All pass.
- HUMAN REVIEW: test expectation changed: 8 pgTAP assertions in `budget_save_edit.test.sql` were wrong when written (row counts, one message, one top-up amount); see DECISIONS FD-05. No assertion removed.

## Files changed
- Docs: this folder.
- Tests: `supabase/tests/budget_save_edit.test.sql`, `src/server/budget/actions.test.ts`, `src/features/family-budget/edit-budget-save.test.tsx`, `tests/integration/family-budget-update-funds.test.ts`, `tests/e2e/family-budget-update-funds.spec.ts`.
- Production: `supabase/migrations/20261002113224_budget_save_edit.sql`, `src/lib/supabase/database.types.ts`, `src/server/budget/actions.ts`, `src/features/family-budget/edit-budget-view.tsx`, `src/app/(family)/family/[clientId]/budget/edit/page.tsx`.

## Decisions
- See DECISIONS.md (FD-01 atomic save, FD-02 mock vs supabase, FD-03 errors, FD-04 no-change save).

## Problems encountered
- The Next dev server on `127.0.0.1` does not hydrate sign-in (allowedDevOrigins), so e2e runs need a production build; the build type-checks tests, so a missing action module breaks it (a throwaway stub was used once and deleted).

## Assumptions
- Admin of the client's organisation saving through this page is allowed by the database already (REQ-38); the admin route itself is ADM-11.

## Next action
- Visual check, status page, then ask the human to approve the PR.

## Ready for PR
- Yes, pending the human's approval to open it
