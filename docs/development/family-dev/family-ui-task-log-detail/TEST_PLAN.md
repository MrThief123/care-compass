# Test Plan — FAM-UI-07 Family Task log and Task detail screens (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given fixtures, when Task log renders, then 9 rows appear starting 'Mon 30 Nov · Morning medication · Aisha R. · Done · Aisha R.'. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given status filter Overdue, when applied, then only Weekly weigh-in and Medication review remain, each with nurse '—'. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given search 'Zoe', when applied, then 'No matches for "Zoe".' is shown. | ☐ | NOT RUN |
| T-04 | AC-04 | component | Given the Morning medication detail, when rendered, then 'Done · Aisha R.' and 'Completed at 09:14' are shown. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
