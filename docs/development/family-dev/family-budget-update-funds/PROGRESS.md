# Progress — FAM-11 Family — Update funds (Edit budget)

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: F — Family
Sprint: SPRINT · planned D15–D16
Branch: `feature/family-budget-update-funds` (from `main`)
PR target: `main`
Last updated: 2026-10-02 (docs rewritten, tests written and red)

## Blockers
- None. OQ-04, OQ-05, OQ-19 are ANSWERED.

## Dependencies status
- FAM-10 — MERGED TO DEV
- F0-12 — MERGED TO DEV
- FAM-UI-05 — MERGED TO DEV

## Completed
- Docs rewritten under CHG-020/021/022: PRD, ACs (8), USER_STORIES, TEST_PLAN (15 tests), DECISIONS (FD-01 to FD-05).
- Tests written first and confirmed failing for the right reason (see TEST_PLAN "Run record").

## In progress
- None. Next: implementation.

## Remaining
- Migration `save_budget_edit` (`supabase migration new`), regenerate `database.types.ts`.
- `src/server/budget/actions.ts` (`saveBudgetEdit`).
- Wire `EditBudgetView` (`persist` prop from the page; error banner; no double submit).
- Run the suites, update the status page, ask before opening the PR.

## Acceptance criteria status
- 0 / 8 MET

## Tests
- Written: 15 test cases in 5 files (60 pgTAP asserts, 26 + 9 + 6 Vitest cases, 1 e2e).
- Passing: only the guards (5 pgTAP count asserts, 3 component, none of the new behaviour).
- Failing: everything that needs `save_budget_edit` / `saveBudgetEdit`.

## Files changed
- Docs: this folder.
- Tests: `supabase/tests/budget_save_edit.test.sql`, `src/server/budget/actions.test.ts`, `src/features/family-budget/edit-budget-save.test.tsx`, `tests/integration/family-budget-update-funds.test.ts`, `tests/e2e/family-budget-update-funds.spec.ts`.
- Likely next: a new migration, `src/lib/supabase/database.types.ts`, `src/server/budget/actions.ts`, `src/features/family-budget/edit-budget-view.tsx`, `src/app/(family)/family/[clientId]/budget/edit/page.tsx`.

## Decisions
- See DECISIONS.md (FD-01 atomic save, FD-02 mock vs supabase, FD-03 errors, FD-04 no-change save).

## Problems encountered
- The Next dev server on `127.0.0.1` does not hydrate sign-in (allowedDevOrigins), so e2e runs need a production build; the build type-checks tests, so a missing action module breaks it (a throwaway stub was used once and deleted).

## Assumptions
- Admin of the client's organisation saving through this page is allowed by the database already (REQ-38); the admin route itself is ADM-11.

## Next action
- New session with a clear context: implement per SESSION_STATE.md.

## Ready for PR
- No
