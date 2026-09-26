# Test Plan — CAR-UI-01 Carer Home screen (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/features/carer-home/carer-home.test.tsx` (Vitest + Testing Library + axe). Renders the route's page and layout with the `src/server/**` contract replaced by test fixtures.
- **contract** → `src/server/shifts/queries.test.ts`, `src/server/notifications/queries.test.ts` (Vitest, node, `DATA_SOURCE=mock`). Exercise the new contract functions against `src/mocks` fixtures.
- **manual** → browser width sweep 1920 → 768 px.

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Today's calendar shows one row '08:00–12:00' with 'Margaret'; no 'Done'/'Planned' pill, no event title; the contract is asked for the signed-in carer's id. | ☐ | NOT RUN |
| T-02 | AC-02 | component | Notifications include 'New shift assigned: Tuesday 1 Dec, 09:00–11:00 (Margaret).' and that row's chip reads 'Admin'. | ☐ | NOT RUN |
| T-03 | AC-03 | component | The carer layout renders a 'Notifications' bell button in the header. | ☐ | NOT RUN |
| T-04 | AC-04 | component | No 'Tasks' heading and no checkbox anywhere on the screen. | ☐ | NOT RUN |
| T-05 | AC-05 | component | The 'Today's calendar' and 'Notifications' regions share one row container, calendar first. | ☐ | NOT RUN |
| T-06 | AC-06 | contract | `getCarerNotifications('staff-aisha')` returns 3 shift notifications (assigned, changed, cancelled), newest first, all source 'admin', each naming Margaret; the first is the AC-02 text. Unknown carer → []. Supabase mode → not-implemented error. | ☐ | NOT RUN |
| T-07 | AC-01 | contract | `getCarerTodayShifts('staff-aisha')` returns only today's Margaret shift 08:00–12:00 with `clientFirstName` 'Margaret' (not Tuesday's shift, not Sarah's); Sarah gets her 13:00–17:00 shift; unknown carer → []; rows ordered by start; Supabase mode → not-implemented error. | ☐ | NOT RUN |
| T-08 | AC-06 | component | Every rendered notification chip reads 'Admin'; no 'Family' chip. | ☐ | NOT RUN |
| T-09 | AC-07 | component | Empty shifts → 'No shifts today'; empty notifications → 'No notifications'. | ☐ | NOT RUN |
| T-10 | AC-08 | component | Either contract rejecting → error state; 'Try again' calls router.refresh; console.error receives no error message text. | ☐ | NOT RUN |
| T-11 | AC-09 | component | Loading skeleton has role status 'Loading' and no regions or data. | ☐ | NOT RUN |
| T-12 | AC-10 | component | axe: populated, empty, error and loading states have no violations. | ☐ | NOT RUN |
| T-13 | PRD edge case | manual | Width sweep 1920 → 768 px: cards never overlap, a long client name wraps or truncates, notifications wrap. | ☐ | NOT RUN |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR (`--grep-invert "F0-07"`).

## Test data
- Component tests build their own fixtures (TEST_PLAN "a test may create its own fixtures"). Contract tests use `src/mocks` fixtures, which this feature changes under CHG-025: `CARER_NOTIFICATIONS` becomes three shift notifications for Aisha, and `SHIFTS` gains the shifts they refer to (Tue 1 Dec 09:00–11:00 and Wed 2 Dec 13:00–17:00, Margaret).

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
