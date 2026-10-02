# Test Plan — CAR-07 Carer — Add and edit events for a patient

## Approach
Tests are written **before** production code (TESTING.md §2). Run them, confirm they fail for the expected reason, then implement.

## Test levels used
- **component** → `src/features/carer-patients/carer-manage-events.test.tsx` (Vitest + Testing Library; server contracts mocked, as in CAR-06)
- **integration** → `tests/integration/carer-manage-events.test.ts` (real local Supabase; skips against a hosted project)
- **e2e** → `tests/e2e/carer-manage-events.spec.ts` (Playwright, local Supabase)
- Regression: the CAR-06 suite (`carer-complete-task.test.tsx`, T-07 changed, see DECISIONS FD-03) and the Family event-form, calendar, task-detail suites must stay green unchanged.

## Test cases

| Test ID | Covers | Level | Test description | Written first? | Result |
|---|---|---|---|---|---|
| T-01 | AC-01 | e2e + integration | Aisha on shift opens 'Enter event' on Margaret's Calendar, fills the form and saves; Helen's Family Calendar shows it. Integration: an on-shift carer's `createEvent` row is created by her and Helen reads it. | ☑ | Integration PASSES already (database side is F0-11). e2e written, not yet runnable (no routes). |
| T-02 | AC-02 | integration | `createEvent` is refused with no shift, a shift not started, a shift ended, or a shift with a different client, and creates nothing; `updateEvent` off shift is refused and the event is unchanged. | ☑ | PASSES already (database side is F0-11); guards against regressions. |
| T-03 | AC-03 | component + e2e | 'Enter event' (Calendar), 'Add event for Margaret' (Patients card, not nested in the card link) and 'Edit event' (Task detail) exist on shift under `/carer/patients/<id>/`; none exists off shift; Home and Care log have none. | ☑ | Component: on-shift cases FAIL (links absent); off-shift and Home cases pass. e2e written. |
| T-04 | AC-04 | component | Add form: empty with Title, Start time, Duration, Documents; missing Date or Title shows an error and calls nothing; complete form calls `createEvent` for Margaret and returns to Home or the Calendar view it came from; Cancel creates nothing; no `/family/` link. | ☑ | FAIL (route does not exist). |
| T-05 | AC-05 | component + integration + e2e | Edit form opens with the event's values, documents and Scope choice; Save calls `updateEvent` and returns to the carer Task detail; another client's event is not found. Integration: on-shift carer edits Helen's event, Helen sees it. | ☑ | Component FAIL (route does not exist); integration PASSES already; e2e written. |
| T-06 | AC-06 | component + integration + e2e | A refused save (add and edit) shows "Your shift with Margaret has ended, so this event wasn't saved.", keeps the typed values and does not navigate; any other failure keeps the generic message. Integration: after the shift ends, `createEvent` and `updateEvent` are refused. e2e: an admin ends the shift while the form is open. | ☑ | Component FAIL (route/message missing); integration PASSES already; e2e written. |
| T-07 | AC-07 | component + e2e | Off shift, `/events/new` and `/events/<id>/edit` redirect to the patient's Calendar and read no event or budget data; with no shift at all they redirect to Patients. | ☑ | FAIL (route does not exist). |
| T-08 | AC-08 | component | Family Calendar, Task detail, Add event and Edit event keep `/family/` links, Cost fields, the generic refusal message and their return paths. | ☑ | PASSES (guards the additive `notAllowedMessage` prop). |
| T-09 | AC-03 (CAR-06 AC-07) | component | CAR-06's T-07 changed: Calendar has Enter event on shift (none off shift), still no Edit event or View breakdown; Home and Care log unchanged. | ☑ | New Calendar case FAILS; the rest pass. HUMAN REVIEW: test expectation changed (FD-03). |

## Regression scope
- Run the full unit/component suite and `supabase test db` before marking READY FOR PR.
- Run the CAR-06 and Family event suites unchanged except T-07.
- Run Playwright e2e tests for this dashboard before opening the PR (`--grep-invert "F0-07"`, local Supabase only).

## How to run
- Component: `npx vitest run src/features/carer-patients/carer-manage-events.test.tsx`
- Integration (local stack; `.env.local` points at the hosted project, so override from `supabase status -o env`): `NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… npx vitest run tests/integration/carer-manage-events.test.ts`
- e2e: `npx playwright test tests/e2e/carer-manage-events.spec.ts` against the local stack.

## Test data
- The integration and e2e tests seed their own organisation, carer, family member and client (as CAR-06 does). Component tests use fixtures for Margaret (shift in progress), Robert (view only) and a stranger (no shift).

## Coverage mapping rule
Every AC must have ≥1 test. Tests may only be modified after implementation begins for reasons in TESTING.md §6, recorded in DECISIONS.md.
