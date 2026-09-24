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
| T-05 | AC-05 | component | Given the Add event form, the task switch is On, and pressing it turns it Off and On again. | ☑ | PASS |
| T-06 | AC-06 | component | Given Edit event, the task switch is On for Physiotherapy and Off for Afternoon walk. | ☑ | PASS |
| T-07 | AC-07 | unit + component + e2e | Added by CHG-015. `editEventHrefFrom` carries the encoded occurrence key and each origin (Calendar week / month / day, Home, Task log with and without a view, none); round trip link → params → same origin; hostile client and event ids stay one path segment (`event-form-return.test.ts`). Task detail's button href with the occurrence and origin (`task-detail-view.test.tsx`, `[occurrenceKey]/page.test.tsx`). e2e: Calendar → Task detail → Edit event opens on Saturday 28 November (`family-event-form.spec.ts`). | ☑ | PASS |
| T-08 | AC-08 | unit + page + e2e | Added by CHG-015. `editEventReturnHref` for each origin with and without an occurrence; Back from the returned Task detail still reaches the first origin (`event-form-return.test.ts`). Page: Save and Cancel push the Task detail with origin, never `router.back`; no valid occurrence → origin screen; other event's or unknown key → origin or Task log; no params → Task log; four hostile `from` values never echoed (`edit/page.test.tsx`). e2e: Cancel then Back to Calendar; reload of a shared link then Save and Back to Home; hostile origin stays in the app (`family-event-form.spec.ts`). | ☑ | PASS |
| T-09 | AC-09 | unit + page + e2e | Added by CHG-015. `addEventReturnHref` is Home, hostile client id encoded (`event-form-return.test.ts`); Save (with a date) and Cancel push Home, never `router.back` (`new/page.test.tsx`); e2e: Add event opened directly, Cancel goes to Home (`family-event-form.spec.ts`). | ☑ | PASS |
| T-10 | AC-10 | unit + page | Added by CHG-017. `addEventHrefFrom` and `addEventReturnHref` with a Calendar origin (every view), round trip link → page params, a `from=tasks` / hostile `from` goes Home, hostile Calendar params fall back (`event-form-return.test.ts`); on the page, Save (with a date) and Cancel push the Calendar view (`new/page.test.tsx`). | ☐ | NOT RUN |

## Where the tests live
- T-01, T-03: `src/app/(family)/family/[clientId]/events/[eventId]/edit/page.test.tsx` (real mock contract), plus the `?occurrence=` cases, Add file, Save/Cancel, local-state edits, the 404 and axe.
- T-06: the edit page test above. T-05: the new page test below.
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
