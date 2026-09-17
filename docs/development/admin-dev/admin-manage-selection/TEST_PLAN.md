# Test Plan — ADM-06 Admin — Manage: staff and client selection

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given Aisha Rahman and Margaret are selected, when rendered, then both rows are solid-filled with checks and the summary reads 'Aisha Rahman → Margaret'. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given a selection, when Clear is clicked, then both selections are removed. | ☐ | NOT RUN |
| T-03 | AC-03 | integration | Given search 'Sar' in Staff, when submitted, then only Sarah Nguyen is listed. | ☐ | NOT RUN |
| T-04 | AC-04 | integration | Given another organisation's staff, when the Staff column loads, then they are absent. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
