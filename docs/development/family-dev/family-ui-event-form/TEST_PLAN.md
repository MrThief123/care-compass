# Test Plan — FAM-UI-03 Family Add / Edit event screens (UI)

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/**/<component>.test.tsx` (Vitest + Testing Library + axe)
- **e2e** → `tests/e2e/<feature>.spec.ts` (Playwright)

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | component | Given the Physiotherapy fixture, when Edit event renders, then Date 'Monday 30 November 2026', Recurring 'Weekly', Status Planned and the description text are shown. | ☑ | PASS |
| T-02 | AC-02 | component | Given the Add event form with no date, when Save event is pressed, then a Date error is shown. | ☑ | PASS |
| T-03 | AC-03 | component | Given Edit event, when rendered, then document tiles 'Physio referral.pdf' and 'Exercise plan.pdf' and an 'Add file' tile are shown. | ☑ | PASS |
| T-04 | AC-04 | e2e | Given Family Home, when 'Enter event' is clicked, then the Add event screen opens. | ☑ | PASS |

## Where the tests live
- T-01, T-03: `src/app/(family)/family/[clientId]/events/[eventId]/edit/page.test.tsx` (real mock contract), plus the `?occurrence=` cases, Add file, Save/Cancel, local-state edits, the 404 and axe.
- T-02: `src/app/(family)/family/[clientId]/events/new/page.test.tsx`, plus the empty form, Save after a date is picked, and axe with the error shown.
- T-04: `tests/e2e/family-event-form.spec.ts`, plus an e2e smoke of the prefilled Edit route.
- States: `src/app/(family)/family/[clientId]/events/states.test.tsx` (loading, error retry, not-found, axe).
- Contract (CHG-008): `src/server/events/queries.test.ts` `getEvent` block.

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run Playwright e2e tests for this dashboard before opening the PR.

## Test data
- Use `F0-16` seed data (Banksia Home Care, Margaret, Helen, Aisha R., Priya) unless a test creates its own fixtures.

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
