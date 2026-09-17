# Test Plan — ADM-UI-02 Admin Manage screen (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given Aisha Rahman and Margaret selected, when rendered, then both rows are selected and the summary reads 'Aisha Rahman → Margaret'. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given Clear is clicked, when rendered, then no rows are selected. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given fixture shift 11:30–13:00 and slot 11:00–15:00 selected, when rendered, then the warning mentions 11:30–13:00 and Assign shift remains enabled. | ☐ | NOT RUN |
| T-04 | AC-04 | component | Given the panel, when rendered, then no Repeat control exists. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
