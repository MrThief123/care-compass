# Test Plan — FAM-06 Family — Add event (Enter event)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)
- **integration** → `tests/integration/<feature>.test.ts` (Vitest against local Supabase)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component + integration | Given Helen on Home, when she clicks 'Enter event', completes required fields with Recurring 'Weekly' and saves, then the event appears on the calendar every week from the chosen date. | ☑ | PASS |
| T-02 | AC-02 | component | Given the Date field is empty, when Save event is pressed, then an error is shown on Date and nothing is submitted. | ☑ | PASS |
| T-03 | AC-03 | component | Given the Pick a date panel for a month with events, when rendered, then days that already have an occurrence show event dots (and days that don't, don't) and the selected day is filled. | ☑ | PASS |
| T-04 | AC-04 | integration | Given a carer with no active shift, or an unrelated family user, calls the create-event action for Margaret, when executed, then it is rejected. | ☑ | PASS |
| T-05 | AC-05 | component | Given Cancel is clicked, when the form has unsaved input, then no event is created. | ☑ | PASS |

Level adaptations from the original plan (recorded per TESTING.md §6 as a level change, not a behaviour change):
- T-01: e2e → component + integration. This repo's Playwright e2e always runs `DATA_SOURCE=mock`, and the mock data source's occurrences are static fixture arrays, not expanded from a recurrence rule — so a created event's future weekly occurrences cannot appear in a mock-mode e2e read. A component test proves `createEvent` is called with the right payload (`event-form-add.test.tsx`); the integration suite proves the real weekly expansion end to end against Supabase (DECISIONS.md FD-02).
- T-03: the PRD's own example days (24, 26, 27 November 2026) no longer isolate the mechanism — the current fixtures give every day in November 2026 an occurrence (daily-repeating medication tasks), so "which days show a dot" cannot be distinguished there. December 2026 has partial coverage (1-5 only) in the same fixtures and proves the identical mechanism (DECISIONS.md FD-02's sibling reasoning, recorded inline in `events/new/page.test.tsx`).

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures. F0-16 is not merged yet; tests create their own fixtures (integration) or use the existing mock fixtures (component), consistent with FAM-02/FAM-04/FAM-05.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
