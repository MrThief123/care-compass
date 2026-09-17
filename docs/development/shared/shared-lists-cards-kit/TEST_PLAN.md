# Test Plan — UI-03 Lists and cards kit: tables, rows, person/stat/budget/alert cards, client info view

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given a Government bucket 3000 total / 2760 used in alert state, when BudgetBucketCard renders, then it shows '$240', 'of $3,000 · 92% used', a warning icon and the alert tone. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given AlertListCard with 3 overdue rows, when rendered, then the badge shows '3' and each row has an 'Overdue' pill. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given SelectableListRow selected, when rendered, then it has aria-selected='true' and shows a check icon. | ☐ | NOT RUN |
| T-04 | AC-04 | component | Given ClientInfoView with canEdit=false, when rendered, then no 'Edit' links and no 'Add file' tile exist. | ☐ | NOT RUN |
| T-05 | AC-05 | component | Given NotificationRow with source 'family', when rendered, then the chip text is 'Family'. | ☐ | NOT RUN |
| T-06 | AC-06 | component | Given each component, when checked with axe, then there are no violations. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
