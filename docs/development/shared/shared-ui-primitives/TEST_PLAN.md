# Test Plan — F0-14 Core UI primitives and state components

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given a done occurrence completed by Aisha Rahman, when the Status pill renders, then its text reads 'Done · Aisha Rahman' (full name, per PD-038) and includes a check icon. | ☑ | PASS |
| T-02 | AC-02 | component | Given an overdue occurrence, when the Status pill renders, then it shows a warning icon and the text 'Overdue'. | ☑ | PASS |
| T-03 | AC-03 | component | Given a Search field with query 'Zoe' and no results, when rendered in no-results state, then the text 'No matches for "Zoe".' is shown. | ☑ | PASS |
| T-04 | AC-04 | component | Given ErrorState with an onRetry handler, when Retry is clicked, then the handler is called once. | ☑ | PASS |
| T-05 | AC-05 | component | Given each primitive, when checked with axe, then no violations are reported. | ☑ | PASS |
| T-06 | AC-06 | component | Given a Segmented control with no value prop, when rendered, then 'W' is selected. | ☑ | PASS |

Additional tests written beyond the minimum AC mapping (uncontrolled/controlled SegmentedControl behaviour, SearchField loading/clear/empty states, EmptyState rendering) — all passing. Full suite: `npm run test` — 91/91 passing (20 files), including all pre-existing tests.

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
