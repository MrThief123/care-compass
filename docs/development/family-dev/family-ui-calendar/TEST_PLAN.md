# Test Plan — FAM-UI-02 Family Calendar screen (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given no view param, when the calendar renders, then W is selected and '30 Nov – 6 Dec 2026' is shown. | ☑ | PASS |
| T-02 | AC-02 | component | Given fixtures, when the week renders, then Physiotherapy blocks appear at 11:30 on MON 30 and FRI 4. | ☑ | PASS |
| T-03 | AC-03 | component | Given a user selects TUE 1, when the Tasks panel updates, then its subtitle reads 'Tuesday 1 December'. | ☑ | PASS |
| T-04 | AC-04 | component | Given Physiotherapy unticked, when ticked, then its label is struck through (local state). | ☑ | PASS |
| T-05 | AC-05 | e2e | Given the week view, when M is pressed, then a December 2026 month grid is shown. | ☑ | PASS |

## Where the tests live
- T-01 to T-04: `src/features/family-calendar/family-calendar.test.tsx` (titles `[FAM-UI-02][AC-xx] T-0x …`).
- T-05: `tests/e2e/family-calendar.spec.ts`.

## Additional tests (written first, same session)
- `src/features/family-calendar/family-calendar.test.tsx`: today from the contract, fallback for bad params, a block opens Task detail, the Tasks panel on the default, empty and URL-selected day, the URL kept on selection, a Done task ticked and untickable (OQ-10 default), ticks surviving day changes, the Log panel (three rows, View all, empty), the month and day views, Previous/Next, loading, error and Retry, empty week, a long title wraps, and axe on the week and month views. 26 tests.
- `src/features/family-calendar/calendar-params.test.ts`: URL parsing and fallbacks, visible ranges, D/W/M switching (the AC-05 month rule), stepping across months and years, selection, hrefs. 22 tests.
- `src/server/events/occurrences.test.ts`: the CHG-006 contract (`getOccurrences`, `getToday`): the design week as drawn, inclusive Melbourne-day boundaries, order, client isolation, prototype keys, empty ranges, copies, validation and the 42-day limit, the Supabase-mode message, future rows open in Task detail but stay out of the Task log. 17 tests.
- `tests/e2e/family-calendar.spec.ts`: selection survives a reload; no horizontal overflow at 1920, 1280, 1024 and 768 px.

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
