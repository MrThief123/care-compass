# Progress — CAR-07 Carer — Add and edit events for a patient

Status: MERGED TO DEV (merged to `main` in #204, 2026-10-02)
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D15–D16
Branch: `feature/carer-manage-events`
PR target: `main`
Last updated: 2026-10-02 (implemented, all 8 ACs MET, browser-checked)

## Blockers
- None. OQ-09, OQ-22 and OQ-19 are ANSWERED.
- For the human in the PR: FD-04 (additive `notAllowedMessage` prop in a Lane F file) and FD-08 (additive `canAddEvent` on the Family Home view).
- **HUMAN REVIEW: test expectation changed** (FD-03, FD-08): CAR-06 T-07; CAR-07 T-03 (Patients card, Home).
- Pre-existing red, not this feature's: `[CAR-06][AC-08] T-08` (FD-06) and 150 vitest failures in 12 files, identical on clean `main` (FD-09).

## Dependencies status
- CAR-04, F0-11, UI-02 — MERGED to main. Also builds on CAR-06, FAM-06, FAM-07 and F0-23 (all merged).

## Completed
- Claimed; CHG-048 and CHG-049 recorded; docs rewritten; tests first (component 26, integration 8, e2e 4)
- Routes `events/new` and `events/[eventId]/edit` with loading, error, not-found; off shift redirects to the Calendar before any data is read
- Entry points on shift only: Calendar and Home 'Enter event', Task detail 'Edit event'; none on the Patients card
- `notAllowedMessage` on `EventFormScreen`; `canAddEvent` on `FamilyHomeView`
- Verified in a real browser, 1920 to 768; shift inserted for the check and deleted afterwards
- PL-27 parked (root PRD.md §17)

## In progress
- None

## Remaining
- Human review of the PR; merge by the human

## Acceptance criteria status
- 8 / 8 MET

## Tests
- Component 26/26; integration 8/8 and e2e 4/4 on the local stack. See TEST_PLAN.md "Results".
- `npm run verify`: lint, typecheck, format clean; tests fail only on the 150 pre-existing failures.
- CI is down: all of this was run locally after merging `origin/main` (up to date).

## Files changed
- Production: `src/app/(carer)/carer/patients/[clientId]/events/**` (new), `…/calendar/page.tsx`, `…/home/page.tsx`, `…/tasks/[occurrenceKey]/page.tsx`, `src/features/family-event-form/event-form-screen.tsx` (prop), `src/features/family-home/family-home-view.tsx` (prop), `src/features/family-task-detail/task-detail-view.tsx` (comment)
- Tests: `carer-manage-events.test.tsx`, `carer-complete-task.test.tsx` (T-07), integration and e2e specs
- Docs: this folder, root DECISIONS.md (CHG-048, CHG-049), PRD.md (PL-27), DEVELOPMENT_PLAN.md, status page

## Decisions
- See DECISIONS.md (FD-01 to FD-09) and root CHG-048, CHG-049

## Problems encountered
- `.env.local` points at the hosted Supabase project; integration and e2e were run against the local stack only.

## Assumptions
- FD-04, FD-05 assumptions; design gap noted in FD-09.

## Next action
- Human reviews the PR.

## Ready for PR
- Yes
