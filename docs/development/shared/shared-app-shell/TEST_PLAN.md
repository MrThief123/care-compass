# Test Plan — F0-15 Role app shell: rail, header and layouts

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given Helen viewing Margaret's record, when the Family header renders, then 'Margaret' is the page title with subline '78 years · Preston VIC · Banksia Home Care' and 'Helen' appears separately at the right. | ☑ | PASS |
| T-02 | AC-02 | component | Given the Family rail, when rendered, then items are exactly Home, Info, Calendar, Budget, Settings in that order. | ☑ | PASS |
| T-03 | AC-03 | component | Given the Carer rail, when rendered, then items are exactly Home, Patients, Calendar, Settings. | ☑ | PASS |
| T-04 | AC-04 | component | Given the Admin rail, when rendered, then items are exactly Home, Manage, Staff, Clients, Settings. | ☑ | PASS |
| T-05 | AC-05 | component | Given the Family or Admin header, when rendered, then no bell button exists in the DOM; given the Carer header, then a bell button exists. | ☑ | PASS |
| T-06 | AC-06 | e2e | Given Aisha on /carer/calendar, when the page loads, then the Calendar rail item is marked active (aria-current='page'). | ☑ | PASS (run against `next dev`; `next build` currently fails for any mock-backed route — see DECISIONS.md FD-03) |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
