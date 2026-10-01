# Test Plan — FAM-01 Family Home — Today day-view timeline

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)
- **unit** → `src/**/<module>.test.ts` (Vitest)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given Morning medication 09:00 1 hr done by Aisha Rahman, when the Today panel renders, then a block at 09:00 shows 'Morning medication', 'Aisha R.', '1 hr' and pill 'Done · Aisha R.'. | ☑ | PASSES on first run (regression guard: FAM-UI-01 built it) |
| T-02 | AC-02 | component | Given Physiotherapy 11:30 lasting 90 minutes and not yet done, when rendered, then its block spans 11:30–13:00, shows '1 hr 30 min' and pill 'Planned'. | ☑ | PASSES on first run (regression guard) |
| T-03 | AC-03 | unit | Given events at 09:00 (60 min) and 11:30 (90 min), when `positionBlocks` runs with 44px rows from 07:00, then tops are 88px and 198px and heights 44px and 66px. | ☑ | PASSES on first run (regression guard) |
| T-04 | AC-04 | component | Given no occurrences today, when rendered, then the empty state is shown instead of blocks. | ☑ | PASSES on first run (regression guard) |
| T-05 | AC-05 | integration | Given Helen requests `/family/<Robert id>/home`, when the server renders, then she is redirected and Robert's data is not fetched. | ☑ | FAILS: the page never calls `assertClientAccess` (page), integration guard passes (F0-22) |
| T-06 | AC-06 | component | Given the occurrence query fails, when rendered, then ErrorState with Retry is shown. | ☑ | PASSES on first run (regression guard) |

| T-07 | AC-01, AC-02, AC-04, AC-06 | unit | `getTodayOccurrences` under `DATA_SOURCE=supabase` reads today's Melbourne window, assembles status, actor and assignee, returns `[]` for an empty day and fails with a generic error (`src/server/events/get-today-occurrences.test.ts`, 5 tests). | ☑ | FAILS: "DATA_SOURCE=supabase is not implemented yet" |
| T-08 | AC-01, AC-02, AC-04, AC-05 | integration | Against local Supabase: only today's occurrences oldest first, assignee from the covering shift (none when no shift covers), empty day, another client's family gets nothing, Helen redirected from Robert's client (`tests/integration/family-home-today.test.ts`, 4 tests). | ☑ | FAILS: 3 of 4 (not implemented); the redirect check passes (F0-22) |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
