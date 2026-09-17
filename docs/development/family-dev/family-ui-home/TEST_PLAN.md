# Test Plan — FAM-UI-01 Family Home screen (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given fixtures, when Family Home renders, then the Today panel shows Morning medication (Done · Aisha R.), Physiotherapy (Planned, 1 hr 30 min) and Afternoon check-in (Planned). | ☐ | NOT RUN |
| T-02 | AC-02 | component | Given fixtures, when rendered, then the Overdue card badge is '3' and lists Wound dressing check (Fri 27 Nov), Medication review (Sat 28 Nov), Weekly weigh-in (Sun 29 Nov). | ☐ | NOT RUN |
| T-03 | AC-03 | component | Given fixtures, when rendered, then the budget line reads '$17,870 remaining of $32,000 · 44% used' and Government is in alert state. | ☐ | NOT RUN |
| T-04 | AC-04 | component | Given Recent activity, when 'View all' is clicked, then navigation targets `/family/<id>/tasks`. | ☐ | NOT RUN |
| T-05 | AC-05 | component | Given no overdue fixtures, when rendered, then 'All caught up' is shown in the Overdue card. | ☐ | NOT RUN |
| T-06 | AC-06 | component | Given the contract query rejects, when rendered, then 'Something went wrong' with Retry is shown. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
