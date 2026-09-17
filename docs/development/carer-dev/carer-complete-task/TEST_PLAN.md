# Test Plan — CAR-06 Carer — Mark tasks done

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e | Given Aisha on an active shift for Margaret, when she ticks Physiotherapy on Home, then Family Home shows 'Done · Aisha R.' for Physiotherapy. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given Aisha is not on shift, when Home renders, then task checkboxes are not interactive. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given the server rejects the completion, when ticked, then the checkbox reverts and an error is shown. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
