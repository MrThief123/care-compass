# Test Plan — FAM-11 Family — Update funds (Edit budget)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement. Rewritten on start under CHG-020/021/022.

## Test levels used
- **db** → `supabase/tests/budget_save_edit.test.sql` (pgTAP, `supabase test db`)
- **unit (server)** → `src/server/budget/actions.test.ts` (Vitest, Supabase client faked)
- **component** → `src/features/family-budget/edit-budget-save.test.tsx` (Vitest + Testing Library)
- **integration** → `tests/integration/family-budget-update-funds.test.ts` (Vitest against local Supabase, through real sessions)
- **e2e** → `tests/e2e/family-budget-update-funds.spec.ts` (Playwright, `E2E_DATA_SOURCE=supabase`, local Supabase only)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Helen signs in, adds 1000 to a bucket on Edit budget, saves; Budget shows the new remaining and '+$1,000' first in History; still there after reload. | ☑ | FAILS: $15,880 is gone after a reload (the save is local state, nothing stored) |
| T-02 | AC-01 | integration | As Helen, `save_budget_edit` adding 1000 raises `budget_bucket_summary` remaining by 1000 and writes one `funds_added` row. | ☑ | FAILS: `@/server/budget/actions` / `save_budget_edit` does not exist |
| T-03 | AC-02 | db | Each wrong field (amount ≤ 0, 3 decimals, over-balance removal, empty/long/duplicate name, missing starting amount) is refused with the right errcode and a `detail` field path; nothing written. | ☑ | FAILS: `@/server/budget/actions` / `save_budget_edit` does not exist |
| T-04 | AC-02 | unit | Action refuses bad ids, non-numeric or negative amounts, over-long names with `VALIDATION` and calls nothing. | ☑ | FAILS: `@/server/budget/actions` / `save_budget_edit` does not exist |
| T-05 | AC-03 | db | Carer, other family, other organisation's admin, signed-out: `42501`, nothing changes; own-organisation admin accepted, recorder is the admin. | ☑ | FAILS: `@/server/budget/actions` / `save_budget_edit` does not exist |
| T-06 | AC-03 | integration | Same matrix through real sessions (hosted-safe: local only). | ☑ | FAILS: `@/server/budget/actions` / `save_budget_edit` does not exist |
| T-07 | AC-03 | unit | A `42501` from the database maps to `NOT_ALLOWED` with a message naming no client. | ☑ | FAILS: `@/server/budget/actions` / `save_budget_edit` does not exist |
| T-08 | AC-04 | db | A valid top-up plus one bad field: no `budget_fund_entries` row added, no rename applied. | ☑ | FAILS: `@/server/budget/actions` / `save_budget_edit` does not exist |
| T-09 | AC-05 | db | The mixed save (add, remove, rename, add bucket, remove bucket, note): rows, kinds, signs, note on each, recorder name, no row for rename, removed money recorded; a name freed by a removal or rename is reusable in the same save. | ☑ | FAILS: `@/server/budget/actions` / `save_budget_edit` does not exist |
| T-10 | AC-06 | db | Top-up pays the pending cost whole, oldest first, stopping at the first that does not fit; a smaller top-up pays nothing. | ☑ | FAILS: `@/server/budget/actions` / `save_budget_edit` does not exist |
| T-11 | AC-02 | unit | A database refusal with `detail` `buckets.1.amount` becomes a field error under that key with the database's message; an unknown code becomes `UNEXPECTED` with a fixed message. | ☑ | FAILS: `@/server/budget/actions` / `save_budget_edit` does not exist |
| T-12 | AC-07 | unit | The action calls `save_budget_edit` once with `{p_client_id, p_buckets, p_added, p_note}` (snake_case, dollars), mock mode returns `NOT_AVAILABLE` without calling. | ☑ | FAILS: `@/server/budget/actions` / `save_budget_edit` does not exist |
| T-13 | AC-07 | component | Supabase mode: Save calls the action once and goes to Budget with a refresh; field refusal marks the field and focuses it; general failure shows one message, values kept; unchanged save calls nothing. | ☑ | FAILS: `@/server/budget/actions` / `save_budget_edit` does not exist |
| T-14 | AC-08 | component | Mock mode: Save calls no action and keeps the local-state behaviour. | ☑ | PASSES (guard: mock mode is unchanged) |
| T-15 | AC-05 | integration | The mixed save through a real session, read back through `getBudgetSummary` / `getFundHistory` (shapes the screen draws). | ☑ | FAILS: `@/server/budget/actions` / `save_budget_edit` does not exist |

## Run record (tests-first, 2026-10-02)
- `supabase test db supabase/tests/budget_save_edit.test.sql`: 60 planned, 55 fail with `42883 function save_budget_edit(...) does not exist`; the 5 that pass count seeded rows and so cannot depend on the function.
- `vitest run src/server/budget/actions.test.ts`: 26 fail, `Cannot find package '@/server/budget/actions'`.
- `vitest run src/features/family-budget/edit-budget-save.test.tsx`: 6 fail (the action is never called); 3 pass, all guards (a save the page refuses never reaches the action, an unchanged save calls nothing, mock mode calls nothing).
- `vitest run tests/integration/family-budget-update-funds.test.ts` (local stack): 6 fail, `Cannot find package '@/server/budget/actions'`; seeding and cleanup ran.
- `playwright test tests/e2e/family-budget-update-funds.spec.ts` (production build, local stack, a throwaway action stub deleted afterwards): fails at the reload, `$15,880` is not stored.

## Regression scope
- Full unit/component suite (`npm test`), `supabase test db`, integration for budget (`family-budget-overview`, `budget-thresholds`, `family-home-budget-strip`, `pending-cost-emails`), e2e for this feature locally. CI is unavailable: list the commands and results in the PR.
- Existing FAM-UI-05 tests (`budget-edit.test.ts`, `family-budget.test.tsx`) must stay green with no assertion changed.

## Test data
- pgTAP and integration create their own organisations, people and clients (same shape as `budget.test.sql`); e2e creates and removes its own rows and must not run against the hosted project (`.env.local` points there: use the local stack).

## Coverage mapping rule
Every AC has ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
