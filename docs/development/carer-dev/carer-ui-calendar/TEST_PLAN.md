# Test Plan — CAR-UI-03 Carer Calendar screen (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

Rewritten by CHG-025 and CHG-030 (2026-09-26), before implementation started: T-01 and T-02 test the rewritten AC-01 and AC-02; T-04 to T-10 are new. Amended by CHG-031 (2026-09-26): the component tests render Carer Home; T-03, T-04, T-06, T-09 and T-10 changed (DECISIONS.md FD-04).

## Test levels used
- **contract** → `src/server/shifts/queries.test.ts` (Vitest, node, mock data source)
- **component** → `src/features/carer-home/carer-home-calendar.test.tsx` (Vitest + Testing Library + axe). The Carer Home page is rendered with the `src/server/**` contract mocked, as in `carer-home.test.tsx`; Week unless the test passes its own params.

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Week of 30 Nov: three 'Margaret' blocks, MON 30 '08:00–12:00', TUE 1 '09:00–11:00', WED 2 '13:00–17:00'; no status word, no event title. | ☑ | PASS |
| T-02 | AC-02 | component | No 'Tasks for the selected shift' heading, no checkbox. | ☑ | PASS |
| T-03 | AC-03 | component | No params: D checked, 'Shifts' heading, `getCarerShifts('staff-aisha', {from: '2026-11-30', to: '2026-11-30'})`; `view=week`: W checked, `{from: '2026-11-30', to: '2026-12-06'}`. | ☑ | PASS |
| T-04 | AC-04 | component | Clicking the TUE 1 week block, or today's day block, pushes `/carer/patients/client-margaret`. | ☑ | PASS |
| T-05 | AC-05 | component | `view=day&date=2026-12-01`: D checked, one day-timeline block 'Margaret' '09:00–11:00'; `view=month&month=2026-12`: M checked, 'Margaret' chips on 30 Nov, 1 Dec, 2 Dec. | ☑ | PASS |
| T-06 | AC-06 | component | Next week, Previous week, Today (from the week of 9 Dec), Next day (from today's Day view) and M push the expected `/carer/home?…` URLs. | ☑ | PASS |
| T-07 | AC-07 | contract | `getCarerShifts`: Aisha's week gives three rows earliest first with `clientFirstName`; Sarah's shift excluded; a one-day range gives only that day; unknown carer `[]`; `to` before `from` rejects. | ☑ | PASS |
| T-08 | AC-08 | component | No shifts: 'No shifts' shows, D/W/M and the arrows remain. | ☑ | PASS |
| T-09 | AC-09 | component | A rejected `getCarerShifts` or `getToday` shows 'Something went wrong'; 'Try again' calls `router.refresh`; the log holds no message text. | ☑ | PASS |
| T-10 | AC-10 | component | axe: populated, empty, error. | ☑ | PASS |

## Regression scope
- Run the full unit/component suite before marking READY FOR PR (`supabase test db` not affected: no migration).
- Run Playwright e2e tests for this dashboard before opening the PR (`--grep-invert "F0-07"`).

## Test data
- Component tests use their own fixtures shaped like `SHIFTS` (Aisha's three shifts with Margaret). Contract tests use `src/mocks/fixtures.ts` `SHIFTS` unchanged.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
