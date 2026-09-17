# Test Plan — CAR-04 Carer — Client info

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
| T-01 | AC-01 | component | Given Aisha is assigned but not on shift, when Margaret's info renders, then no Edit links or Add file tile exist. | ☐ | NOT RUN |
| T-02 | AC-02 | e2e | Given Aisha is on an active shift for Margaret, when she edits Habits and saves, then the change is shown. | ☐ | NOT RUN |
| T-03 | AC-03 | db | Given Aisha is not on shift, when she updates client_info_sections for Margaret directly, then RLS rejects it. | ☐ | NOT RUN |
| T-04 | AC-04 | integration | Given Aisha is not assigned to a client, when she opens that client's info URL, then she is redirected to Patients. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
