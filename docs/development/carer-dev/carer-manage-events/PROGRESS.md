# Progress — CAR-07 Carer — Add and edit events for a patient

Status: IN PROGRESS
Owner: Dhruv Verma
Lane: C — Carer
Sprint: SPRINT · planned D15–D16
Branch: `feature/carer-manage-events`
PR target: `main`
Last updated: 2026-10-02 (docs rewritten for CHG-048; tests written first, red)

## Blockers
- None. OQ-09, OQ-22 and OQ-19 are ANSWERED.
- FD-04 (the `notAllowedMessage` prop in a Lane F file) needs the human's sign-off in the PR.
- Pre-existing red: `[CAR-06][AC-08] T-08` Family Home (FD-06). Not this feature's.

## Dependencies status
- CAR-04, F0-11, UI-02 — MERGED to main. Also builds on CAR-06, FAM-06, FAM-07 and F0-23 (all merged).

## Completed
- Claimed; branch cut from `main`; CHG-048 recorded; PRD, ACs (2 → 8), user stories, test plan, decisions rewritten
- Tests first: component (26), integration (8), e2e (4); CAR-06 T-07 changed (FD-03, HUMAN REVIEW)

## In progress
- None (stopped after the red tests, as asked)

## Remaining
- Carer routes `events/new` and `events/[eventId]/edit` (+ loading, error, not-found)
- Entry points: Calendar `canAddEvent`, Task detail `canEdit`, Patients card link (outside the card's own link)
- `notAllowedMessage` prop on `EventFormScreen`; carer return hrefs under `/carer/patients/<id>/`
- Make the component tests and the e2e spec green; refresh the status page; pre-PR suite run; PR (after the human says yes)

## Acceptance criteria status
- 0 / 8 MET (database side of AC-02, AC-05 and AC-06 already passes in integration; the UI half is NOT MET)

## Tests
- Written: 8 / 8 ACs covered
- Component: 20 failing, 6 passing (the passing ones guard Family and off-shift behaviour). Integration: 8 passing against local Supabase. e2e: written, not run (needs the routes).

## Files changed
- Docs: this folder, root DECISIONS.md (CHG-048), DEVELOPMENT_PLAN.md
- Tests: `src/features/carer-patients/carer-manage-events.test.tsx`, `src/features/carer-patients/carer-complete-task.test.tsx` (T-07), `tests/integration/carer-manage-events.test.ts`, `tests/e2e/carer-manage-events.spec.ts`
- Likely production files: `src/app/(carer)/carer/patients/[clientId]/events/**`, `…/calendar/page.tsx`, `…/tasks/[occurrenceKey]/page.tsx`, `src/features/carer-patients/carer-patients-view.tsx`, `src/features/family-event-form/event-form-screen.tsx` (prop only)

## Decisions
- See DECISIONS.md (FD-01 to FD-06) and root CHG-048

## Problems encountered
- `.env.local` points at the hosted Supabase project; integration tests were run with the local stack's URL and keys passed on the command line.

## Assumptions
- FD-04 and FD-05 are assumptions (not asked of the human).

## Next action
- Implement in a fresh session using the prompt in SESSION_STATE.md.

## Ready for PR
- No
