# Progress — FAM-06 Family — Add event (Enter event)

Status: READY FOR PR
Owner: MrThief123
Lane: F — Family
Sprint: SPRINT · planned D9
Branch: `feature/family-add-event`
PR target: `family-dev`
Last updated: 2026-09-27

## Blockers
- None — OQ-22, OQ-12 and OQ-10 are all ANSWERED (root DECISIONS.md).

## Dependencies status
- F0-09 — MERGED TO DEV
- F0-11 — MERGED TO DEV
- FAM-UI-03 — MERGED TO DEV

## Completed
- Traced the gap: FAM-UI-03 already built the Add/Edit event screen, the 'Enter event' button,
  the EventForm's Date/Recurring/Description/Cost/Documents fields and the Pick-a-date panel,
  all on the mock contract — but every field's own doc comment says saving is deferred to
  FAM-06/FAM-07, and OQ-22's Title/Start time/Duration fields did not exist on the form yet.
- Added `EventDetailsFields` (Title, Start time, Duration — OQ-22/PD-047) as a local
  `extraFields` component, Add event only (DECISIONS.md FD-01).
- Added `createEvent` to `src/server/events/actions.ts`: Zod-validated, maps the domain's
  9-option recurrence to the database's `{frequency, interval}` pair (PD-046), combines Date +
  Start time into the anchor `starts_at` (Melbourne wall-clock, OQ-32), and inserts into
  `care_events` for `DATA_SOURCE=supabase`; permission is enforced by the existing
  `care_events_insert` RLS policy (DECISIONS.md FD-03), not re-checked in the action.
- Added a matching mock mutation `createEvent` (`src/mocks/queries/events.ts`): adds the event
  and its anchor occurrence to the in-memory fixtures, so it's visible immediately under
  `DATA_SOURCE=mock` (dev preview, Playwright) — does not expand the full recurring series
  (DECISIONS.md FD-02).
- Wired `EventFormScreen.save()`: on Add event, validates Cost and the new Title/Start
  time/Duration fields, then calls `createEvent` and only navigates on success; shows an inline
  error and stays on the form on failure. Edit event's behaviour is unchanged (FAM-07's job).
- Computed `datesWithItems` for the Pick-a-date panel's dots (`events/new/page.tsx`, via
  `getOccurrences`) — previously never wired at all.
- New integration suite (`tests/integration/family-add-event.test.ts`) against local Supabase:
  a real weekly event recurs correctly (T-01), a one-off event has exactly one occurrence, a
  carer with no active shift and an unrelated family user are both refused (T-04), and a
  malformed payload is rejected before touching the database.
- New/updated component tests: `event-details.test.ts`, `event-details-fields.test.tsx`,
  `event-form-add.test.tsx` (payload shape, success/failure/cancel), FAM-06-labelled tests in
  `events/new/page.test.tsx` (Pick-a-date dots, AC-03) plus two pre-existing FAM-UI-03 tests
  updated to fill the now-required Title field before Save event.
- Ran the full unit/component suite, typecheck, lint, format check and the relevant Playwright
  e2e specs (family-event-form, family-task-detail-nav, family-calendar) — all green.

## In progress
- None

## Remaining
- None in FAM-06's scope.

## Acceptance criteria status
- 5 / 5 MET

## Tests
- Written: 20 (5 in `event-details.test.ts`, 3 in `event-details-fields.test.tsx`, 5 in
  `event-form-add.test.tsx`, 2 new + 2 updated in `events/new/page.test.tsx`, 5 integration
  cases; plus 2 pre-existing FAM-UI-08 tests adjusted to add `clientId`/fill Title)
- Passing: all (`npx vitest run` — 1954 passed / 37 skipped; `tests/integration/family-add-event.test.ts`
  5/5 against local Supabase; `npm run verify`; Playwright e2e specs 27/27)
- Failing: 0

## Files changed
- `src/server/events/actions.ts` — new `createEvent` action, recurrence-frequency mapping
- `src/mocks/queries/events.ts` — new mock `createEvent`
- `src/features/family-event-form/event-details.ts` — new (values + validation)
- `src/features/family-event-form/event-details-fields.tsx` — new (UI)
- `src/features/family-event-form/event-form-screen.tsx` — `clientId`/`datesWithItems` props,
  async `save()`, save-error status region
- `src/app/(family)/family/[clientId]/events/new/page.tsx` — passes `clientId`, computes
  `datesWithItems`
- `src/app/(family)/family/[clientId]/events/[eventId]/edit/page.tsx` — passes `clientId`
- `src/features/family-event-form/event-form-cost.test.tsx` — `clientId` added; two tests fill
  Title before Save event
- `src/app/(family)/family/[clientId]/events/new/page.test.tsx` — FAM-06 tests, two tests fill
  Title before Save event
- `src/app/(family)/family/[clientId]/events/[eventId]/edit/page.test.tsx` — scoped a
  `getByRole("status")` query to the Documents region (two status regions now exist)
- `tests/integration/family-add-event.test.ts` — new

## Decisions
- See DECISIONS.md (FD-01 — local extraFields component, FD-02 — mock/integration test-level
  split, FD-03 — AC-04 reads "a carer" as RLS's existing shift-based rule)

## Problems encountered
- None

## Assumptions
- PROPOSED items in PRD.md are unconfirmed until validated in F0-01 or answered in DECISIONS.md.
- The error copy "Couldn't save. Please try again." reuses FAM-05's own PROPOSED text for the
  same failure shape (`ActionResult`'s `UNEXPECTED` case).

## Next action
- Push (already done); open the PR to `family-dev` once CI is green (human authorises PR
  creation per DEVELOPMENT_WORKFLOW.md §7).

## Ready for PR
- Yes.
