# Test Plan — FAM-12 Family — Settings: family info and password reset

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | integration (was e2e, FD-05) | Given Helen's phone '0412 345 678', when she changes it and saves (per OQ-35), then the new number is shown after reload. | ☑ | PASS |
| T-02 | AC-02 | component | Given an invalid email 'helen@', when saved, then an email error is shown. | ☑ | PASS |
| T-03 | AC-03 | unit + integration (FD-05) | Given Helen clicks Reset, when the action runs, then a reset email is requested for her address and a confirmation message is shown. | ☑ | PASS |
| T-04 | AC-04 | db | Given Helen, when she updates another profile's row, then RLS rejects it. | ☑ | PASS |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
