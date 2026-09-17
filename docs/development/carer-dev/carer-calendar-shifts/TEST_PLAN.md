# Test Plan — CAR-05 Carer — Calendar (shifts) and selected-shift tasks

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given seed data for Aisha, when week of 30 Nov renders, then MON 30 shows blocks at 09:00, 11:30 and 15:00 labelled with 'Margaret —'. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given the 09:00 block is selected, when the task panel renders, then its subtitle reads '09:00 · Margaret — Morning medication'. | ☐ | NOT RUN |
| T-03 | AC-03 | integration | Given Daniel's shifts exist, when Aisha's calendar loads, then none of Daniel's shifts appear. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
