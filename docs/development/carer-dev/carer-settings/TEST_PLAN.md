# Test Plan — CAR-09 Carer — Settings

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **db** → `supabase/tests/<feature>.test.sql` (pgTAP via `supabase test db`)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given Aisha's profile, when Settings renders, then Name 'Aisha Rahman', Phone '0423 987 654', Email 'aisha.r@banksiahomecare.com.au', Role 'Registered Nurse' are shown. | ☐ | NOT RUN |
| T-02 | AC-02 | db | Given Aisha, when she updates her own job_title, then RLS/column privileges reject it. | ☐ | NOT RUN |
| T-03 | AC-03 | integration | Given Reset clicked, when the action runs, then a reset email is requested. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
