# Test Plan — CAR-UI-03 Carer Calendar screen (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given fixtures, when the week renders, then MON 30 shows blocks '09:00 Margaret — Morning m…', '11:30 Margaret — Physiother…', '15:00 Margaret — Afternoon c…'. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given the 09:00 block is selected, when the panel renders, then the subtitle reads '09:00 · Margaret — Morning medication' with three checklist items. | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given no view param, when rendered, then W is selected. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
