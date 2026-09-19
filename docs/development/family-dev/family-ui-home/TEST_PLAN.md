# Test Plan — FAM-UI-01 Family Home screen (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given fixtures, when Family Home renders, then the Today panel shows Morning medication (Done · Aisha Rahman), Physiotherapy (Planned, 1 hr 30 min) and Afternoon check-in (Planned). | ☑ | PASS |
| T-02 | AC-02 | component | Given fixtures, when rendered, then the Overdue card badge is '3' and lists Wound dressing check (Fri 27 Nov), Medication review (Sat 28 Nov), Weekly weigh-in (Sun 29 Nov). | ☑ | PASS |
| T-03 | AC-03 | component | Given fixtures, when rendered, then the budget line reads '$17,870 remaining of $32,000 · 44% used' and Government is in alert state. | ☑ | PASS |
| T-04 | AC-04 | component | Given Recent activity, when 'View all' is clicked, then navigation targets `/family/<id>/tasks`. | ☑ | PASS |
| T-05 | AC-05 | component | Given no overdue fixtures, when rendered, then 'All caught up' is shown in the Overdue card. | ☑ | PASS |
| T-06 | AC-06 | component | Given the contract query rejects, when rendered, then 'Something went wrong' with Retry is shown. | ☑ | PASS |

### Where the tests live and what else they cover
- `src/features/family-home/family-home.test.tsx` renders the route's page (`await FamilyHomePage(...)` then `render`) with the `src/server/**` contract replaced by test-local fixtures that mirror the design (DECISIONS.md FD-08). T-01 to T-06 are the AC-01 to AC-06 tests. AC-06 also has a logging test and runs once per contract function (`getTodayOccurrences`, `getTaskLog`, `getBudgetSummary`).
- `src/features/family-home/home-data.test.ts` covers the pure selectors behind AC-02 (oldest-first order) and AC-03 (aggregate budget line), plus the Recent activity selection.
- PRD Scope items with no AC are tagged `[FAM-UI-01][Scope]`: reads through the contract for the route's client, the Today caption, Enter event and View breakdown links, Recent activity contents and order, chevron navigation to task detail (Recent activity and Overdue), empty states for Today, Recent activity and Budget, the loading skeleton, and axe checks on the populated, error and loading states.
- Not covered by an automated test (jsdom cannot measure layout): long-text truncation and pixel layout. Both were checked in a browser, see PROGRESS.md.

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR. (Phase 1 screen, no database: `supabase test db` and the `supabase` CLI were not run in this session.)
- Run Playwright e2e tests for this dashboard before opening the PR. (No Family e2e specs exist yet; a production `next build` with dummy Supabase env compiled the route.)

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
