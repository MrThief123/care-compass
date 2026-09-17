# Test Plan — FAM-UI-06 Family Settings screen (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given fixtures, when Settings renders, then Name 'Helen', Phone '0412 345 678', Email 'helen@example.com', Address '12 Wattle St, Preston VIC 3072' are shown. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given 'Change' is clicked, when the modal opens, then its title is 'Change organisation?' and the body states Banksia Home Care will lose access immediately. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given the modal, when Cancel is clicked, then it closes and nothing else happens. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
