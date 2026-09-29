# Session State — FAM-06 Family — Add event (Enter event)

Last session date: 2026-09-27
Current branch: `feature/family-add-event` (from `family-dev`, pushed, claimed)
Worked on: wiring the Add event form's Save button to real persistence (`createEvent`), adding
the OQ-22 Title/Start time/Duration fields the form was missing, and the Pick-a-date panel's
event dots (never wired at all before this).
What changed:
- `src/server/events/actions.ts`: new `createEvent` action (mock + Supabase branches, PD-046
  recurrence mapping).
- `src/mocks/queries/events.ts`: new mock `createEvent` (adds the event + its anchor occurrence).
- `src/features/family-event-form/event-details.ts` / `event-details-fields.tsx`: new — Title,
  Start time, Duration values/validation/UI, mirroring `event-cost.ts`/`event-cost-fields.tsx`.
- `src/features/family-event-form/event-form-screen.tsx`: `clientId`/`datesWithItems` props,
  async `save()` on Add event, save-error status region.
- `events/new/page.tsx`: passes `clientId`, computes `datesWithItems` via `getOccurrences`.
- `events/[eventId]/edit/page.tsx`: passes `clientId` (required prop; edit persistence unchanged).
- New: `event-details.test.ts`, `event-details-fields.test.tsx`, `event-form-add.test.tsx`,
  `tests/integration/family-add-event.test.ts`.
- Updated (test-change, not behaviour, per TESTING.md §6): `event-form-cost.test.tsx` (clientId
  prop, fill Title before Save event in two tests), `events/new/page.test.tsx` (same, plus new
  FAM-06 tests), `events/[eventId]/edit/page.test.tsx` (scoped a `getByRole("status")` query —
  two status regions now exist on the screen).
Tests run: `npx vitest run` (full suite), `npm run test:integration` equivalent (local Supabase
env override for the new integration file), `npm run typecheck`, `npm run lint`,
`npm run format:check`, `npx playwright test tests/e2e/family-event-form.spec.ts
tests/e2e/family-task-detail-nav.spec.ts tests/e2e/family-calendar.spec.ts` (fresh `npm run
build` first).
Test results: full unit/component suite green (1954 passed / 37 skipped); new integration file
5/5 passed; the three e2e specs 27/27 passed; `npm run verify` clean (lint's 3 warnings are
pre-existing, unrelated files).
Current blocker: None — OQ-22, OQ-12 and OQ-10 are all ANSWERED (root DECISIONS.md).
Important discoveries:
- FAM-UI-03 built the Add/Edit event screen close to Phase 3 shape (real `EventForm` from the
  UI kit, real Cost/TaskSwitch wiring by FAM-UI-08), but every relevant doc comment explicitly
  deferred saving to FAM-06/FAM-07 — `EventFormScreen.save()` only validated Cost and navigated,
  never touching the server.
- OQ-22's Title/Start time/Duration fields did not exist on the form at all yet (the kit's
  `EventForm` deliberately leaves them to an `extraFields` slot, per its own doc comment).
- The mock data source's occurrences are static fixture arrays (`src/mocks/fixtures.ts`), not
  expanded from a recurrence rule at read time — unlike Supabase's real path (F0-11,
  `src/lib/recurrence`). This meant a created event's future weekly occurrences can't show up in
  a mock-mode (Playwright) read without duplicating the recurrence engine inside the mock layer,
  which is shared-folder territory FAM-06 should not take on (DECISIONS.md FD-02) — so AC-01's
  "recurs every week" claim is proven at the integration level instead.
- The current fixtures give every day in November 2026 an occurrence (daily-repeating medication
  tasks), so AC-03's literal "days 24, 26, 27" example can't show the Pick-a-date dots are
  selective there — December 2026 (partial coverage, days 1-5 only) proves the same mechanism.
- `care_events_insert`'s RLS policy already allows a carer to write during an active shift
  (OQ-09, F0-11) — by design, for CAR-07 later. AC-04's "a carer... is rejected" is satisfied by
  a carer with no active shift, not by rejecting carers categorically (DECISIONS.md FD-03).
Important decisions: FD-01 (local `extraFields` component, Add event only), FD-02 (mock vs.
integration test-level split for recurrence), FD-03 (AC-04's carer case) — all in this feature's
DECISIONS.md; none need human review (all follow already-answered OQs or existing architecture).
Exact next action: push (already done); open the PR to `family-dev` (human authorises PR
creation).
Files likely to be touched next: none expected before PR.
Warning for next session: the Add/Edit event screen now has two `role="status"` regions (the
pre-existing Documents upload notice, and this feature's save-error message) — a bare
`getByRole("status")` in a future test will need scoping to disambiguate, as
`edit/page.test.tsx` now does.
